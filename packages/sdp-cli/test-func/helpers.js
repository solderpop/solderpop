import path from 'path';
import os from 'os';
import process from 'process';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createWorkingDirectory = (prefix) =>
  fs.mkdtempSync(path.resolve(os.tmpdir(), `sdp-cli-test-${prefix}-`));

export const bundledWorkspacePath = path.resolve(
  __dirname,
  '..',
  'bundle',
  'workspace'
);

export const getFilesFromPath = (p, extension) => {
  const dir = fs.readdirSync(p);
  return dir.filter((el) => el.match(new RegExp(`.*.(${extension})$`, 'ig')));
};

// @oclif/test's runCommand() prints this ts-node warning to stderr on its
// own (a real `sdpc` invocation doesn't) -- strip it before asserting.
const TS_WARNING =
  / › {3}Warning: Could not find typescript\. Please ensure that typescript is a \n › {3}devDependency\. Falling back to compiled source\.\n/;
export const stripOclifTestTsWarning = (stderr) =>
  stderr.replace(TS_WARNING, '');

// Temporarily set env vars for `fn`, then restore them -- deleting a key
// that was previously unset rather than assigning `undefined` back to it,
// since process.env stringifies every value (`= undefined` becomes "undefined").
export const withEnv = async (vars, fn) => {
  const saved = Object.fromEntries(
    Object.keys(vars).map((key) => [key, process.env[key]])
  );
  Object.assign(process.env, vars);
  try {
    return await fn();
  } finally {
    Object.entries(saved).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }
};
