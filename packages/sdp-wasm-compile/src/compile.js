import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fse from 'fs-extra';
import { createError } from 'sdp-func-tools';

// Bundled alongside this package's dist output at build time (babel inlines
// these as plain strings via babel-plugin-inline-import — see .babelrc —
// exactly the same trick sdp-cloud-compile already uses to ship
// sdp-tabtest's Arduino.h/Arduino.cpp to the cloud compiler). No filesystem
// access to packages/sdp-arduino needed at runtime.
import arduinoH from 'sdp-arduino/platform/wasmSimulation/Arduino.h';
import arduinoCpp from 'sdp-arduino/platform/wasmSimulation/Arduino.cpp';
import wasmSerialH from 'sdp-arduino/platform/wasmSimulation/WasmSerial.h';
import wasmSerialCpp from 'sdp-arduino/platform/wasmSimulation/WasmSerial.cpp';
import mainCpp from 'sdp-arduino/platform/wasmSimulation/main.cpp';
import { ensureServer, artifactUrl } from './server.js';
import { getEmxxEnv } from './emcc.js';

const execFileAsync = promisify(execFile);

// `-I .`: the generated sketch (and configuration.tpl.cpp/preamble.h inside
// it) `#include <Arduino.h>`/`#include <WasmSerial.h>` with angle brackets,
// which only resolves via the include search path, not the including
// file's own directory — needs to be explicit even though everything lives
// side-by-side in buildDir.
const EMXX_FLAGS = [
  '-std=c++11',
  '-O2',
  '-I',
  '.',
  '-s',
  'MODULARIZE=1',
  '-s',
  'EXPORT_NAME=Module',
  // The real target is a Web Worker (packages/sdp-client/src/workers/wasm.worker.js),
  // which loads main.wasm from a URL via fetch/XHR (see its `locateFile` option).
  // Left to auto-detect, Emscripten will happily run under plain Node too (e.g. this
  // package's own test harness) and then tries `fs.readFile` on that URL string
  // instead of fetching it, aborting with ENOENT. Pinning the environment makes it
  // deterministic and matches the actual deployment target exactly.
  '-s',
  'ENVIRONMENT=web,worker',
];

let rootDirPromise = null;
const getRootDir = () => {
  if (rootDirPromise === null) {
    rootDirPromise = fse.mkdtemp(path.join(os.tmpdir(), 'sdp_wasm_compile_'));
  }
  return rootDirPromise;
};

const writeSources = async (buildDir, programCode) => {
  await Promise.all([
    fse.writeFile(path.join(buildDir, 'sketch.ino'), programCode),
    fse.writeFile(path.join(buildDir, 'Arduino.h'), arduinoH),
    fse.writeFile(path.join(buildDir, 'Arduino.cpp'), arduinoCpp),
    fse.writeFile(path.join(buildDir, 'WasmSerial.h'), wasmSerialH),
    fse.writeFile(path.join(buildDir, 'WasmSerial.cpp'), wasmSerialCpp),
    fse.writeFile(path.join(buildDir, 'main.cpp'), mainCpp),
  ]);
};

const wrapCompileError = (err) =>
  Promise.reject(
    createError('WASM_COMPILATION_ERROR', {
      message: err.message,
      stderr: err.stderr,
      stdout: err.stdout,
    })
  );

// :: String -> Nullable Path -> Promise Suite Error
const compileSimulation = async (programCode, emsdkRoot = null) => {
  const { emxx, env } = await getEmxxEnv(emsdkRoot);
  const rootDir = await getRootDir();
  const buildDir = await fse.mkdtemp(path.join(rootDir, 'build_'));

  await writeSources(buildDir, programCode);

  await execFileAsync(
    emxx,
    [
      ...EMXX_FLAGS,
      'sketch.ino',
      'Arduino.cpp',
      'WasmSerial.cpp',
      'main.cpp',
      '-x',
      'c++',
      '-o',
      'main.js',
    ],
    { cwd: buildDir, env }
  ).catch(wrapCompileError);

  const port = await ensureServer(rootDir);

  return {
    artifactUrls: {
      'main.js': artifactUrl(rootDir, buildDir, port, 'main.js'),
      'main.wasm': artifactUrl(rootDir, buildDir, port, 'main.wasm'),
    },
    // main() returns right after registering emscripten_set_main_loop
    // (see main.cpp) so loop() keeps firing afterward — prepareModuleOptions.js
    // in sdp-cloud-compile defaults noExitRuntime to false, which is right for
    // a run-to-completion build (Tabtest) but would tear the runtime down the
    // moment main() returns here, killing the scheduled loop() before it ever
    // fires. This override keeps it alive for the process's whole lifetime.
    options: { noExitRuntime: true },
  };
};

export default compileSimulation;
