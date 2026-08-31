import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import fs from 'fs-extra';
import { runCommand } from '@oclif/test';
import chai from 'chai';
import {
  bundledWorkspacePath,
  createWorkingDirectory,
  stripOclifTestTsWarning,
  withEnv,
} from './helpers.js';

const { assert } = chai;

// see test-func/help.spec.js for why this is needed
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// save tty status
const { isTTY } = process.stdout;

const its = (wd, outCppPath) => {
  const myWSPath = path.resolve(wd, 'workspace');
  const projectSrcPath = path.resolve(bundledWorkspacePath, 'blink');

  it(`cannot find project without argument, but creates workspace, stderr , non-zero exit code`, async () => {
    const { stdout, stderr, error } = await runCommand(
      ['transpile', `--workspace=${myWSPath}`],
      { root }
    );
    assert.isOk(
      await fs.pathExists(path.resolve(myWSPath, '.xodworkspace')),
      'workspace should be created'
    );
    assert.equal(stdout, '', 'stdout must be empty');
    assert.match(
      stderr,
      /could not find project directory around/,
      'stderr must be with error'
    );
    assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
  });

  it('fails when wrong path to project, workspace from ENV, exits with non-zero code', () =>
    withEnv({ XOD_WORKSPACE: myWSPath }, async () => {
      const { stdout, stderr, error } = await runCommand(
        [
          'transpile',
          path.resolve(myWSPath, 'kajsdhflkjsdhflkjashldkfjlkjasdfkjl'),
        ],
        { root }
      );
      assert.equal(stdout, '', 'stdout must be empty');
      assert.match(stderr, /Invalid file path/, 'stderr must be with error');
      assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
    }));

  it('fails when wrong patch name, exits with non-zero code', () =>
    withEnv({ XOD_WORKSPACE: myWSPath }, async () => {
      const { stdout, stderr, error } = await runCommand(
        ['transpile', projectSrcPath, 'asdfasdfasdfasdfasdfasdfasdf'],
        { root }
      );
      assert.equal(stdout, '', 'stdout must be empty');
      assert.match(
        stderr,
        /ENTRY_POINT_PATCH_NOT_FOUND_BY_PATH/,
        'stderr must be with error'
      );
      assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
    }));

  it('transpiles project (default patchname - main) to output path, stderr with messages, stdout is empty, exit with zero code', () =>
    withEnv({ XOD_WORKSPACE: myWSPath }, async () => {
      const { stdout, stderr, error } = await runCommand(
        ['transpile', `--output=${outCppPath}`, projectSrcPath],
        { root }
      );
      assert.isOk(
        await fs.pathExists(outCppPath),
        'output file should be created'
      );
      assert.equal(stdout, '', 'stdout must be empty');
      assert.notEqual(stderr, '', 'stderr must be full of messages');
      assert.equal(error?.oclif?.exit, 0, 'exit code must be zero');
    }));

  it('transpiles project to output path (from ENV), stderr is empty, stdout is empty, exit with zero code', () =>
    withEnv({ XOD_WORKSPACE: myWSPath, XOD_OUTPUT: outCppPath }, async () => {
      const { stdout, stderr, error } = await runCommand(
        ['transpile', '--quiet', projectSrcPath, '@/main'],
        { root }
      );
      assert.isOk(
        await fs.pathExists(outCppPath),
        'output file should be created'
      );
      assert.equal(stdout, '', 'stdout must be empty');
      assert.equal(stderr, '', 'stderr must be empty');
      assert.equal(error?.oclif?.exit, 0, 'exit code must be zero');
    }));

  it('transpiles project (default patchname - main) to stdout, stderr with messages, exit with zero code', () =>
    withEnv({ XOD_WORKSPACE: myWSPath }, async () => {
      const { stdout, stderr, error } = await runCommand(
        ['transpile', projectSrcPath],
        { root }
      );
      assert.include(
        stdout,
        'namespace xod {',
        'stdout must containt C++ source'
      );
      assert.match(
        stdout,
        /^\/\/#define XOD_DEBUG$/gm,
        'debug must be disabled'
      );
      assert.notEqual(stderr, '', 'stderr must be with messages');
      assert.equal(error?.oclif?.exit, 0, 'exit code must be zero');
    }));

  it('transpile project (default patchname - main) to stdout with debug on, stderr with messages, exit with zero code', () =>
    withEnv({ XOD_WORKSPACE: myWSPath }, async () => {
      const { stdout, stderr, error } = await runCommand(
        ['transpile', '--debug', projectSrcPath],
        { root }
      );
      assert.include(
        stdout,
        'namespace xod {',
        'stdout must containt C++ source'
      );
      assert.match(stdout, /^#define XOD_DEBUG$/gm, 'debug must be enabled');
      assert.notEqual(stderr, '', 'stderr must be with messages');
      assert.equal(error?.oclif?.exit, 0, 'exit code must be zero');
    }));
};

describe('sdpc transpile', () => {
  // working directory and output file
  const wd = createWorkingDirectory('transpile');
  const outCppPath = path.resolve(wd, 'out.cpp');

  // create working directory
  before(() => fs.ensureDirSync(wd));

  // remove working directory
  // unmock TTY status
  after(() => {
    process.stdout.isTTY = isTTY;
    process.stderr.isTTY = isTTY;
    return fs.remove(wd);
  });

  describe('common', () => {
    it(`shows help in stdout, doesn't print to stderr, exits with 0`, async () => {
      const { stdout, stderr } = await runCommand(['transpile', '--help'], {
        root,
      });
      assert.include(stdout, 'ENTRYPOINT', 'ENTRYPOINT argument not found');
      assert.include(stdout, '--help', '--help flag not found');
      assert.include(stdout, '--output', '--output flag not found');
      assert.include(stdout, '--quiet', '--quiet flag not found');
      assert.include(stdout, '--version', '--version flag not found');
      assert.include(stdout, '--workspace', '--workspace flag not found');
      assert.include(stdout, '--debug', '--debug flag not found');
      assert.equal(
        stripOclifTestTsWarning(stderr),
        '',
        'stderr should be emply'
      );
    });

    it(`shows version in stdout, doesn't print to stderr and exits with 0`, async () => {
      const { stdout, stderr } = await runCommand(['transpile', '--version'], {
        root,
      });
      assert.include(stdout, 'sdp-cli', 'version string not found');
      assert.equal(
        stripOclifTestTsWarning(stderr),
        '',
        'stderr should be emply'
      );
    });
  });

  describe('TTY', () => {
    before(() => {
      process.stdout.isTTY = true;
      process.stderr.isTTY = true;
    });

    afterEach(() => {
      // remove output file
      fs.removeSync(outCppPath);
    });

    its(wd, outCppPath);
  });

  describe('no TTY', () => {
    before(() => {
      process.stdout.isTTY = false;
      process.stderr.isTTY = false;
    });

    afterEach(() => {
      // remove output file
      fs.removeSync(outCppPath);
    });

    its(wd, outCppPath);
  });
});
