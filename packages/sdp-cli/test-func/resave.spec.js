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

const its = (wd) => {
  const myWSPath = path.resolve(wd, 'workspace');
  const resaveSrcPath = path.resolve(bundledWorkspacePath, 'blink');

  it(`cannot find project without argument, but creates workspace, prints error to stderr, non-zero exit code`, async () => {
    const { stdout, stderr, error } = await runCommand(
      ['resave', `--workspace=${myWSPath}`],
      { root }
    );
    assert.isOk(
      await fs.pathExists(path.resolve(myWSPath, '.sdp-workspace')),
      'workspace should be created'
    );
    assert.equal(stdout, '', 'stdout must be empty');
    assert.include(
      stderr,
      'could not find project directory around',
      'stderr must be with error'
    );
    assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
  });

  it('fails when wrong path to project, exits with non-zero code', async () => {
    const { stdout, stderr, error } = await runCommand(
      [
        'resave',
        `--workspace=${myWSPath}`,
        path.resolve(myWSPath, 'kajsdhflkjsdhflkjashldkfjlkjasdfkjl'),
      ],
      { root }
    );
    assert.equal(stdout, '', 'stdout must be empty');
    assert.include(stderr, 'Invalid file path', 'stderr must be with error');
    assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
  });

  it('prints solderball to stdout, messages to stderr and exit with 0', async () => {
    const { stdout, stderr, error } = await runCommand(
      ['resave', `--workspace=${myWSPath}`, resaveSrcPath],
      { root }
    );
    const solderball = JSON.parse(stdout);
    assert.equal(solderball.name, 'blink', 'stdout must be json');
    assert.notEqual(stderr, '', 'stderr must be with messages');
    assert.equal(error?.oclif?.exit, 0, 'exit code must be zero');
  });

  it('save solderball to solderball, prints status messages to stderr, stdout is empty, exit with 0', async () => {
    const { stdout, stderr, error } = await runCommand(
      [
        'resave',
        `--workspace=${myWSPath}`,
        `--output=${path.resolve(wd, 'blink.solderball')}`,
        resaveSrcPath,
      ],
      { root }
    );
    assert.isOk(
      await fs.pathExists(path.resolve(wd, 'blink.solderball')),
      'solderball should be created'
    );
    assert.notEqual(stderr, '', 'stderr must be full of messages');
    assert.equal(stdout, '', 'stdout must be empty');
    assert.equal(error?.oclif?.exit, 0, 'exit code must be zero');
  });

  it('save solderball to directory, quiet flag (stderr is empty, stdout is empty), workspace and output flags from ENV, exit with 0', () =>
    withEnv(
      {
        XOD_WORKSPACE: myWSPath,
        XOD_OUTPUT: path.resolve(wd, 'blink'),
      },
      async () => {
        const { stdout, stderr, error } = await runCommand(
          ['resave', '-q', resaveSrcPath],
          { root }
        );
        assert.isOk(
          await fs.pathExists(path.resolve(wd, 'blink')),
          'project directory should be created'
        );
        assert.equal(stderr, '', 'stderr must be empty');
        assert.equal(stdout, '', 'stdout must be empty');
        assert.equal(error?.oclif?.exit, 0, 'exit code must be zero');
      }
    ));

  it('fails on saving solderball to directory without write access, quiet flag (stderr is empty, stdout is empty), workspace and output flags from ENV, exit with non-zero', () =>
    withEnv(
      {
        XOD_WORKSPACE: myWSPath,
        XOD_OUTPUT: '/dev/null/cantcreate',
      },
      async () => {
        const { stdout, stderr, error } = await runCommand(
          ['resave', '-q', resaveSrcPath],
          { root }
        );
        assert.equal(stderr, '', 'stderr must be empty');
        assert.equal(stdout, '', 'stdout must be empty');
        assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
      }
    ));
};

describe('sdpc resave', () => {
  // working directory, workspace, src project path
  const wd = createWorkingDirectory('resave');

  // create working directory
  before(() => fs.ensureDirSync(wd));

  // remove working directory
  // unmock TTY status
  after(() => {
    process.stdout.isTTY = isTTY;
    process.stderr.isTTY = isTTY;
    return fs.removeSync(wd);
  });

  describe('common', () => {
    it(`shows help in stdout, doesn't print to stderr, exits with 0`, async () => {
      const { stdout, stderr } = await runCommand(['resave', '--help'], {
        root,
      });
      assert.include(stdout, 'PROJECT', 'PROJECT argument not found');
      assert.include(stdout, '--help', '--help flag not found');
      assert.include(stdout, '--output', '--output flag not found');
      assert.include(stdout, '--quiet', '--quiet flag not found');
      assert.include(stdout, '--version', '--version flag not found');
      assert.include(stdout, '--workspace', '--workspace flag not found');
      assert.equal(
        stripOclifTestTsWarning(stderr),
        '',
        'stderr should be emply'
      );
    });

    it(`shows version in stdout, doesn't print to stderr and exits with 0`, async () => {
      const { stdout, stderr } = await runCommand(['resave', '--version'], {
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

    its(wd);
  });

  describe('no TTY', () => {
    before(() => {
      process.stdout.isTTY = false;
      process.stderr.isTTY = false;
    });

    its(wd);
  });
});
