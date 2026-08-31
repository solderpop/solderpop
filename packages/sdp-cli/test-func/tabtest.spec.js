import path from 'path';
import os from 'os';
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

const defaultOutputDir = path.resolve(os.tmpdir(), 'sdp-tabtest');

// save tty status
const { isTTY } = process.stdout;

const its = (wd, tabtestOutDir) => {
  const myWSPath = path.resolve(wd, 'workspace');

  it(`cannot find project without argument, but creates workspace, prints error to stderr, non-zero exit code`, async () => {
    const { stdout, stderr, error } = await runCommand(
      ['tabtest', `--workspace=${myWSPath}`],
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
          'tabtest',
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
        [
          'tabtest',
          path.resolve(bundledWorkspacePath, '__lib__', 'xod', 'bits'),
          'asdfasdfasdfasdfasdfasdfasdf',
        ],
        { root }
      );
      assert.equal(stdout, '', 'stdout must be empty');
      assert.match(
        stderr,
        /does not exist in the project/,
        'stderr must be with error'
      );
      assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
    }));

  it('create output dir, run tests for whole project, but do not build (--no-build), stderr with messages, stdout is empty, exit with zero code', () =>
    withEnv({ XOD_WORKSPACE: myWSPath }, async () => {
      const { stdout, stderr, error } = await runCommand(
        [
          'tabtest',
          '--no-build',
          path.resolve(bundledWorkspacePath, '__lib__', 'xod', 'bits'),
        ],
        { root }
      );
      assert.equal(stdout, '', 'stdout must be empty');
      assert.notEqual(stderr, '', 'stderr must be with messages');
      assert.equal(error?.oclif?.exit, 0, 'exit code must be zero');
      assert.isOk(
        await fs.pathExists(defaultOutputDir),
        'output dir should be created'
      );
      assert.isOk(
        await fs.pathExists(
          path.resolve(defaultOutputDir, 'bits', 'bcd-to-dec.sketch.cpp')
        ),
        'tabtest sketch must be copied'
      );
    }));

  it('create output dir, run tests for patch by full path, but do not build (--no-build), stderr with messages, stdout is empty, exit with zero code', () =>
    withEnv({ XOD_WORKSPACE: myWSPath }, async () => {
      const { stdout, stderr, error } = await runCommand(
        [
          'tabtest',
          '--no-build',
          '--quiet',
          `--output-dir=${tabtestOutDir}`,
          path.resolve(
            bundledWorkspacePath,
            '__lib__',
            'xod',
            'bits',
            'bcd-to-dec',
            'patch.xodp'
          ),
        ],
        { root }
      );
      assert.equal(stdout, '', 'stdout must be empty');
      assert.equal(stderr, '', 'stderr must be empty');
      assert.equal(error?.oclif?.exit, 0, 'exit code must be zero');
      assert.isOk(
        await fs.pathExists(tabtestOutDir),
        'output dir should be created'
      );
      assert.isOk(
        await fs.pathExists(
          path.resolve(tabtestOutDir, 'bcd-to-dec.sketch.cpp')
        ),
        'tabtest sketch must be copied'
      );
    }));

  it('create output dir, run tests for patch by project path + short patch name, but do not build (--no-build), stderr with messages, stdout is empty, exit with zero code', () =>
    withEnv(
      { XOD_WORKSPACE: myWSPath, XOD_OUTPUT: tabtestOutDir },
      async () => {
        const { stdout, stderr, error } = await runCommand(
          [
            'tabtest',
            '--no-build',
            '--quiet',
            path.resolve(bundledWorkspacePath, '__lib__', 'xod', 'bits'),
            'bcd-to-dec',
          ],
          { root }
        );
        assert.isOk(
          await fs.pathExists(tabtestOutDir),
          'output dir should be created'
        );
        assert.equal(stdout, '', 'stdout must be empty');
        assert.equal(stderr, '', 'stderr must be empty');
        assert.equal(error?.oclif?.exit, 0, 'exit code must be zero');
        assert.isOk(
          await fs.pathExists(
            path.resolve(tabtestOutDir, 'bcd-to-dec.sketch.cpp')
          ),
          'tabtest sketch must be copied'
        );
      }
    ));

  it('create output dir, run tests for patch by project path + long patch name, build, stderr with messages, stdout is empty, exit with zero code', () =>
    withEnv(
      { XOD_WORKSPACE: myWSPath, XOD_OUTPUT: tabtestOutDir },
      async () => {
        const { stdout, stderr, error } = await runCommand(
          [
            'tabtest',
            '--quiet',
            path.resolve(bundledWorkspacePath, '__lib__', 'xod', 'bits'),
            '@/bcd-to-dec',
          ],
          { root }
        );
        assert.isOk(
          await fs.pathExists(tabtestOutDir),
          'output dir should be created'
        );
        assert.equal(stdout, '', 'stdout must be empty');
        assert.equal(stderr, '', 'stderr must be empty');
        assert.equal(error?.oclif?.exit, 0, 'exit code must be zero');
        assert.isOk(
          await fs.pathExists(path.resolve(tabtestOutDir, 'bcd-to-dec.run')),
          'tabtest must be compiled'
        );
      }
    ));
};

describe('sdpc tabtest', () => {
  // working directory
  const wd = createWorkingDirectory('tabtest');
  const tabtestOutDir = path.resolve(wd, 'tabtests');

  // create working directory
  before(() => fs.ensureDirSync(wd));

  // remove working directory
  // unmock TTY status
  after(() => {
    process.stdout.isTTY = isTTY;
    process.stderr.isTTY = isTTY;
    fs.removeSync(wd);
  });

  describe('common', () => {
    it(`shows help in stdout, doesn't print to stderr, exits with 0`, async () => {
      const { stdout, stderr } = await runCommand(['tabtest', '--help'], {
        root,
      });
      assert.include(stdout, 'ENTRYPOINT', 'ENTRYPOINT argument not found');
      assert.include(stdout, '--help', '--help flag not found');
      assert.include(stdout, '--no-build', '--no-build flag not found');
      assert.include(stdout, '--output-dir', '--output-dir flag not found');
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
      const { stdout, stderr } = await runCommand(['tabtest', '--version'], {
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

    afterEach(async () => {
      // clean out tabtest working directory
      await fs.remove(tabtestOutDir);
      await fs.remove(defaultOutputDir);
    });

    its(wd, tabtestOutDir);
  });

  describe('no TTY', () => {
    before(() => {
      process.stdout.isTTY = false;
      process.stderr.isTTY = false;
    });

    afterEach(async () => {
      // clean out tabtest working directory
      await fs.remove(tabtestOutDir);
      await fs.remove(defaultOutputDir);
    });

    its(wd, tabtestOutDir);
  });
});
