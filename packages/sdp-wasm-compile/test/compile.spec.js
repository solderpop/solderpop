import chai from 'chai';
import os from 'os';
import path from 'path';
import fse from 'fs-extra';

// Imports from dist/, not src/, for the same reason as
// sdp-cloud-compile/test/compile.spec.js: this module inline-imports raw
// .cpp/.h source files (Arduino.h, main.cpp, etc.) via
// babel-plugin-inline-import, a build-time-only transform that
// @babel/register can't apply to files loaded through mocha's native ESM
// `import()`. See that test file's header comment for the full story.
import { writeSources, wrapCompileError } from '../dist/compile.js';

const { assert } = chai;

describe('writeSources', () => {
  let buildDir;

  beforeEach(async () => {
    buildDir = await fse.mkdtemp(
      path.join(os.tmpdir(), 'sdp_wasm_compile_test_')
    );
  });

  afterEach(() => fse.remove(buildDir));

  it('writes the sketch and every bundled Arduino shim file into buildDir', async () => {
    await writeSources(buildDir, 'void setup(){}\nvoid loop(){}\n');

    const files = await fse.readdir(buildDir);
    assert.includeMembers(files, [
      'sketch.ino',
      'Arduino.h',
      'Arduino.cpp',
      'WasmSerial.h',
      'WasmSerial.cpp',
      'main.cpp',
    ]);
  });

  it('writes the given program code verbatim into sketch.ino', async () => {
    const programCode = 'void setup(){}\nvoid loop(){}\n';
    await writeSources(buildDir, programCode);

    const written = await fse.readFile(
      path.join(buildDir, 'sketch.ino'),
      'utf8'
    );
    assert.equal(written, programCode);
  });

  it('writes non-empty bundled shim files', async () => {
    await writeSources(buildDir, 'void setup(){}\nvoid loop(){}\n');

    const shimFiles = [
      'Arduino.h',
      'Arduino.cpp',
      'WasmSerial.h',
      'WasmSerial.cpp',
      'main.cpp',
    ];
    await Promise.all(
      shimFiles.map(async (fileName) => {
        const contents = await fse.readFile(
          path.join(buildDir, fileName),
          'utf8'
        );
        assert.isAbove(contents.length, 0, `${fileName} was written empty`);
      })
    );
  });
});

describe('wrapCompileError', () => {
  it('rejects with a WASM_COMPILATION_ERROR carrying message/stderr/stdout from the original error', async () => {
    const originalError = Object.assign(new Error('emxx exited with 1'), {
      stderr: 'sketch.ino:3:1: error: expected ;',
      stdout: '',
    });

    let caught;
    try {
      await wrapCompileError(originalError);
    } catch (err) {
      caught = err;
    }

    assert.isDefined(caught);
    assert.equal(caught.type, 'WASM_COMPILATION_ERROR');
    assert.equal(caught.payload.message, 'emxx exited with 1');
    assert.equal(caught.payload.stderr, 'sketch.ino:3:1: error: expected ;');
    assert.equal(caught.payload.stdout, '');
  });
});
