import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import fs from 'fs-extra';
import { runCommand } from '@oclif/test';
import chai from 'chai';
import {
  createWorkingDirectory,
  stripOclifTestTsWarning,
  withEnv,
} from './helpers.js';

const { assert } = chai;

// see test-func/help.spec.js for why this is needed
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// save tty status
const { isTTY } = process.stdout;

const its = (wd) => {
  const myWSPath = path.resolve(wd, 'workspace');

  it(`print error on nonexistent board, creates workspace, stdout is empty, stderr with error, non-zero exit code`, async () => {
    const { stdout, stderr, error } = await runCommand(
      ['install:arch', `--workspace=${myWSPath}`, 'adfkjasdfkjasdf'],
      { root }
    );
    assert.isOk(
      await fs.pathExists(path.resolve(myWSPath, '.sdp-workspace')),
      'workspace should be created'
    );
    assert.equal(stdout, '', 'stdout must be empty');
    assert.include(
      stderr,
      'Invalid argument passed: invalid item',
      'stderr must contain error'
    );
    assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
  });

  it(`quiet fails on nonexistent board, creates workspace, stdout is empty, stderr with error, non-zero exit code`, () =>
    withEnv({ XOD_WORKSPACE: myWSPath }, async () => {
      const { stdout, stderr, error } = await runCommand(
        ['install:arch', '--quiet', 'adfkjasdfkjasdf'],
        { root }
      );
      assert.isOk(
        await fs.pathExists(path.resolve(myWSPath, '.sdp-workspace')),
        'workspace should be created'
      );
      assert.equal(stdout, '', 'stdout must be empty');
      assert.equal(stderr, '', 'stderr must be empty');
      assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
    }));

  it(`installs board, creates workspace, stdout is empty, stderr with messages, zero exit code`, () =>
    withEnv({ XOD_WORKSPACE: myWSPath }, async () => {
      const { stdout, stderr, error } = await runCommand(
        ['install:arch', 'emoro:avr'],
        { root }
      );
      assert.isOk(
        await fs.pathExists(path.resolve(myWSPath, '.sdp-workspace')),
        'workspace should be created'
      );
      assert.equal(stdout, '', 'stdout must be empty');
      assert.include(stderr, 'Installing', 'stderr with install messages');
      assert.equal(error?.oclif?.exit, 0, 'exit code must be zero');
    }));

  it(`silently installs board, creates workspace, stdout is empty, stderr is empty, zero exit code`, () =>
    withEnv({ XOD_WORKSPACE: myWSPath }, async () => {
      const { stdout, stderr, error } = await runCommand(
        ['install:arch', '--quiet', 'emoro:avr'],
        { root }
      );
      assert.isOk(
        await fs.pathExists(path.resolve(myWSPath, '.sdp-workspace')),
        'workspace should be created'
      );
      assert.equal(stdout, '', 'stdout must be empty');
      assert.equal(stderr, '', 'stderr must be empty');
      assert.equal(error?.oclif?.exit, 0, 'exit code must be zero');
    }));

  it(`arduino-cli not found, stdout is empty, stderr with error, non-zero exit code`, () =>
    withEnv(
      { XOD_WORKSPACE: myWSPath, SDP_ARDUINO_CLI: '/nonexistent' },
      async () => {
        const { stdout, stderr, error } = await runCommand(
          ['install:arch', 'emoro:avr'],
          { root }
        );
        assert.equal(stdout, '', 'stdout must be empty');
        assert.include(stderr, 'arduino-cli not found', 'stderr with error');
        assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
      }
    ));

  it(`arduino-cli not found, quiet flag, stdout is empty, stderr is empty, non-zero exit code`, () =>
    withEnv(
      { XOD_WORKSPACE: myWSPath, SDP_ARDUINO_CLI: '/nonexistent' },
      async () => {
        const { stdout, stderr, error } = await runCommand(
          ['install:arch', '-q', 'emoro:avr'],
          { root }
        );
        assert.equal(stdout, '', 'stdout must be empty');
        assert.equal(stderr, '', 'stderr must be empty');
        assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
      }
    ));
};

describe('sdpc install:arch', () => {
  // working directory, workspace, src project path
  const wd = createWorkingDirectory('installArch');

  // create working directory
  before(() => fs.ensureDir(wd));

  // remove working directory
  // unmock TTY status
  after(() => {
    process.stdout.isTTY = isTTY;
    process.stderr.isTTY = isTTY;
    fs.removeSync(wd);
  });

  describe('common', () => {
    it(`shows help in stdout, doesn't print to stderr, exits with 0`, async () => {
      const { stdout, stderr } = await runCommand(['install:arch', '--help'], {
        root,
      });
      assert.include(stdout, '--version', '--version flag not found');
      assert.include(stdout, '--help', '--help flag not found');
      assert.include(stdout, '--quiet', '--quiet flag not found');
      assert.include(stdout, '--workspace', '--workspace flag not found');
      assert.equal(
        stripOclifTestTsWarning(stderr),
        '',
        'stderr should be emply'
      );
    });

    it(`shows version in stdout, doesn't print to stderr and exits with 0`, async () => {
      const { stdout, stderr } = await runCommand(
        ['install:arch', '--version'],
        { root }
      );
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

    after(() => {
      fs.removeSync(wd);
    });

    its(wd);
  });

  describe('no TTY', () => {
    before(() => {
      process.stdout.isTTY = false;
      process.stderr.isTTY = false;
    });

    after(() => {
      fs.removeSync(wd);
    });

    its(wd);
  });
});
