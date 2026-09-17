import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import fs from 'fs-extra';
import nock from 'nock';
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

// default inputs
const apiSuffixDefault = 'solderpop.io';
const apiSuffix = 'xod.lol';
const username = 'username';
const onBehalfUsername = 'bro';
const password = 'password';
const token = 'token';
const projectPath = path.resolve(bundledWorkspacePath, 'blink');

// nock mocks
const postAuthEndpoint = (api) =>
  api
    .post('/auth', {
      username,
      password,
    })
    .matchHeader('content-type', 'application/json')
    .reply(200, {
      access_token: token,
      refresh_token: 123,
    });

const postAuthEndpointFailed = (api) => api.post('/auth').reply(403);

const getUserEndpoint = (api) =>
  api.get(/users\/.*/).reply(200, {
    username,
    trusts: [],
  });

const getUserEndpointFailed404 = (api) => api.get(/users\/.*/).reply(404);

const getUserEndpointFailed500 = (api) => api.get(/users\/.*/).reply(500);

const getUserEndpointAnother = (api) =>
  api.get(`/users/${onBehalfUsername}`).reply(200, {
    username: onBehalfUsername,
    trusts: [username],
  });

const getUserEndpointAnotherWithoutTrust = (api) =>
  api.get(`/users/${onBehalfUsername}`).reply(200, {
    username: onBehalfUsername,
    trusts: [],
  });

const getLibEndpoint = (api) => api.get(/users\/.*\/libs\/.*/).reply(200, {});

const getLibEndpointFailed404 = (api) => api.get(/.*/).reply(404);

const getLibEndpointFailed500 = (api) => api.get(/.*/).reply(500);

const putLibEndpoint = (api) =>
  api
    .put(/users\/.*\/libs\/.*/)
    .matchHeader('content-type', 'application/json')
    .matchHeader('authorization', `Bearer ${token}`)
    .reply(200);

const putLibEndpointFailed = (api) => api.put(/users\/.*\/libs\/.*/).reply(404);

const putLibEndpointFailed403 = (api) =>
  api.put(/users\/.*\/libs\/.*/).reply(403);

const postVersionEndpoint = (api) =>
  api
    .post(/users\/.*\/libs\/.*\/versions/, {
      description: /.*/,
      folder: /.*/,
      semver: /.*/,
    })
    .matchHeader('content-type', 'application/json')
    .matchHeader('authorization', `Bearer ${token}`)
    .reply(200);

const postVersionEndpointFailed = (api) =>
  api.post(/users\/.*\/libs\/.*\/versions/).reply(403);

const postVersionEndpointFailed409 = (api) =>
  api.post(/users\/.*\/libs\/.*\/versions/).reply(409);

const its = (wd) => {
  it(`cannot find project without argument, prints error to stderr, non-zero exit code`, () =>
    withEnv({ XOD_USERNAME: username, XOD_PASSWORD: password }, async () => {
      const { stdout, stderr, error } = await runCommand(['publish'], {
        root,
      });
      assert.equal(stdout, '', 'stdout must be emply');
      assert.match(
        stderr,
        /could not find project directory/,
        'stderr must be with error'
      );
      assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
    }));

  it('fails when wrong path to project, exits with non-zero code', () =>
    withEnv({ XOD_USERNAME: username, XOD_PASSWORD: password }, async () => {
      const { stdout, stderr, error } = await runCommand(
        ['publish', path.resolve(wd, 'kajsdhflkjsdhflkjashldkfjlkjasdfkjl')],
        { root }
      );
      assert.equal(stdout, '', 'stdout must be emply');
      assert.match(stderr, /Invalid file path/, 'stderr must be with error');
      assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
    }));

  it(`can't authenticate, stderr with error, stdin is empty, non-zero exit`, () =>
    withEnv(
      {
        XOD_USERNAME: username,
        XOD_PASSWORD: password,
        XOD_API: apiSuffix,
        XOD_ONBEHALF: onBehalfUsername,
      },
      async () => {
        postAuthEndpointFailed(nock(`http://pm.${apiSuffix}`));
        getUserEndpoint(nock(`http://pm.${apiSuffix}`));
        getLibEndpoint(nock(`http://pm.${apiSuffix}`));
        const { stdout, stderr, error } = await runCommand(
          ['publish', projectPath],
          { root }
        );
        // sorry, when TTY is off some mocking bug happens
        if (process.stdout.isTTY) {
          assert.equal(stdout, '', 'stdout must be empty');
        }
        assert.include(stderr, 'Forbidden', 'stderr must be with error');
        assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
      }
    ));

  it(`can't publish because user not found, stderr with error, stdin is empty, non-zero exit`, () =>
    withEnv(
      {
        XOD_USERNAME: username,
        XOD_PASSWORD: password,
        XOD_API: apiSuffix,
        XOD_ONBEHALF: onBehalfUsername,
      },
      async () => {
        postAuthEndpoint(nock(`http://pm.${apiSuffix}`));
        getUserEndpointFailed404(nock(`http://pm.${apiSuffix}`));
        getLibEndpoint(nock(`http://pm.${apiSuffix}`));
        const { stdout, stderr, error } = await runCommand(
          ['publish', projectPath],
          { root }
        );
        if (process.stdout.isTTY) {
          assert.equal(stdout, '', 'stdout must be empty');
        }
        assert.match(stderr, /Unknown user/, 'stderr must be with error');
        assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
      }
    ));

  it(`can't publish because of failed fetch of user, stderr with error, stdin is empty, non-zero exit`, () =>
    withEnv(
      {
        XOD_USERNAME: username,
        XOD_PASSWORD: password,
        XOD_API: apiSuffix,
        XOD_ONBEHALF: onBehalfUsername,
      },
      async () => {
        postAuthEndpoint(nock(`http://pm.${apiSuffix}`));
        getUserEndpointFailed500(nock(`http://pm.${apiSuffix}`));
        getLibEndpoint(nock(`http://pm.${apiSuffix}`));
        const { stdout, stderr, error } = await runCommand(
          ['publish', projectPath],
          { root }
        );
        if (process.stdout.isTTY) {
          assert.equal(stdout, '', 'stdout must be empty');
        }
        assert.match(stderr, /Can't get user/, 'stderr must be with error');
        assert.match(
          stderr,
          /Internal Server Error/,
          'stderr must be with error'
        );
        assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
      }
    ));

  it(`can't publish because of target users not trusts current user, stderr with error, stdin is empty, non-zero exit`, () =>
    withEnv(
      {
        XOD_USERNAME: username,
        XOD_PASSWORD: password,
        XOD_API: apiSuffix,
        XOD_ONBEHALF: onBehalfUsername,
      },
      async () => {
        postAuthEndpoint(nock(`http://pm.${apiSuffix}`));
        getUserEndpointAnotherWithoutTrust(nock(`http://pm.${apiSuffix}`));
        getLibEndpoint(nock(`http://pm.${apiSuffix}`));
        const { stdout, stderr, error } = await runCommand(
          ['publish', projectPath],
          { root }
        );
        if (process.stdout.isTTY) {
          assert.equal(stdout, '', 'stdout must be empty');
        }
        assert.match(stderr, /access/, 'stderr must be with error');
        assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
      }
    ));

  it(`can't publish because of library not found and can't put new one, stderr with error, stdin is empty, non-zero exit`, () =>
    withEnv(
      {
        XOD_USERNAME: username,
        XOD_PASSWORD: password,
        XOD_API: apiSuffix,
        XOD_ONBEHALF: onBehalfUsername,
      },
      async () => {
        postAuthEndpoint(nock(`http://pm.${apiSuffix}`));
        getUserEndpointAnother(nock(`http://pm.${apiSuffix}`));
        getLibEndpointFailed404(nock(`http://pm.${apiSuffix}`));
        putLibEndpointFailed(nock(`http://pm.${apiSuffix}`));
        const { stdout, stderr, error } = await runCommand(
          ['publish', projectPath],
          { root }
        );
        if (process.stdout.isTTY) {
          assert.equal(stdout, '', 'stdout must be empty');
        }
        assert.match(stderr, /Not Found/, 'stderr must be with error');
        assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
      }
    ));

  it(`can't publish because of can't get library, stderr with error, stdin is empty, non-zero exit`, () =>
    withEnv(
      {
        XOD_USERNAME: username,
        XOD_PASSWORD: password,
        XOD_API: apiSuffix,
        XOD_ONBEHALF: onBehalfUsername,
      },
      async () => {
        postAuthEndpoint(nock(`http://pm.${apiSuffix}`));
        getUserEndpointAnother(nock(`http://pm.${apiSuffix}`));
        getLibEndpointFailed500(nock(`http://pm.${apiSuffix}`));
        const { stdout, stderr, error } = await runCommand(
          ['publish', projectPath],
          { root }
        );
        if (process.stdout.isTTY) {
          assert.equal(stdout, '', 'stdout must be empty');
        }
        assert.match(
          stderr,
          /Internal Server Error/,
          'stderr must be with error'
        );
        assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
      }
    ));

  it(`can't publish because of library not found and access denied on creating, stderr with error, stdin is empty, non-zero exit`, () =>
    withEnv(
      {
        XOD_USERNAME: username,
        XOD_PASSWORD: password,
        XOD_API: apiSuffix,
        XOD_ONBEHALF: onBehalfUsername,
      },
      async () => {
        postAuthEndpoint(nock(`http://pm.${apiSuffix}`));
        getUserEndpointAnother(nock(`http://pm.${apiSuffix}`));
        getLibEndpointFailed404(nock(`http://pm.${apiSuffix}`));
        putLibEndpointFailed403(nock(`http://pm.${apiSuffix}`));
        const { stdout, stderr, error } = await runCommand(
          ['publish', projectPath],
          { root }
        );
        if (process.stdout.isTTY) {
          assert.equal(stdout, '', 'stdout must be empty');
        }
        assert.match(stderr, /access/, 'stderr must be with error');
        assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
      }
    ));

  it(`can't publish because post version return unknown error, stderr with error, stdin is empty, non-zero exit`, () =>
    withEnv(
      {
        XOD_USERNAME: username,
        XOD_PASSWORD: password,
        XOD_API: apiSuffix,
        XOD_ONBEHALF: onBehalfUsername,
      },
      async () => {
        postAuthEndpoint(nock(`http://pm.${apiSuffix}`));
        getUserEndpointAnother(nock(`http://pm.${apiSuffix}`));
        getLibEndpointFailed404(nock(`http://pm.${apiSuffix}`));
        putLibEndpoint(nock(`http://pm.${apiSuffix}`));
        postVersionEndpointFailed(nock(`http://pm.${apiSuffix}`));
        const { stdout, stderr, error } = await runCommand(
          ['publish', projectPath],
          { root }
        );
        if (process.stdout.isTTY) {
          assert.equal(stdout, '', 'stdout must be empty');
        }
        assert.match(stderr, /Can't publish/, 'stderr must be with error');
        assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
      }
    ));

  it(`can't publish because version exists, stderr with error, stdin is empty, non-zero exit`, () =>
    withEnv(
      {
        XOD_USERNAME: username,
        XOD_PASSWORD: password,
        XOD_API: apiSuffix,
        XOD_ONBEHALF: onBehalfUsername,
      },
      async () => {
        postAuthEndpoint(nock(`http://pm.${apiSuffix}`));
        getUserEndpointAnother(nock(`http://pm.${apiSuffix}`));
        getLibEndpointFailed404(nock(`http://pm.${apiSuffix}`));
        putLibEndpoint(nock(`http://pm.${apiSuffix}`));
        postVersionEndpointFailed409(nock(`http://pm.${apiSuffix}`));
        const { stdout, stderr, error } = await runCommand(
          ['publish', projectPath],
          { root }
        );
        if (process.stdout.isTTY) {
          assert.equal(stdout, '', 'stdout must be empty');
        }
        assert.match(stderr, /exists/, 'stderr must be with error');
        assert.notEqual(error?.oclif?.exit, 0, 'exit code must be non-zero');
      }
    ));

  it(`can publish library when good username and password from flag and default api suffix, stderr with messages, stdout is empty, exits with zero code`, async () => {
    postAuthEndpoint(nock(`https://pm.${apiSuffixDefault}`));
    getUserEndpoint(nock(`https://pm.${apiSuffixDefault}`));
    getLibEndpoint(nock(`https://pm.${apiSuffixDefault}`));
    postVersionEndpoint(nock(`https://pm.${apiSuffixDefault}`));
    const { stdout, stderr, error } = await runCommand(
      [
        'publish',
        `--username=${username}`,
        `--password=${password}`,
        projectPath,
      ],
      { root }
    );
    if (process.stdout.isTTY) {
      assert.equal(stdout, '', 'stdout must be empty');
    }
    assert.notEqual(stderr, '', 'stdout must be with messages');
    assert.equal(error?.oclif?.exit, 0, 'exit code must be zero');
  });

  it(`can publish library on behalf when good username, password from flag set, non-standart api from flag, on-behalf user from flag with with correct trusts, quiet, stderr is empty, stdout is empty, exits with zero code`, async () => {
    postAuthEndpoint(nock(`http://pm.${apiSuffix}`));
    getUserEndpointAnother(nock(`http://pm.${apiSuffix}`));
    getLibEndpointFailed404(nock(`http://pm.${apiSuffix}`));
    putLibEndpoint(nock(`http://pm.${apiSuffix}`));
    postVersionEndpoint(nock(`http://pm.${apiSuffix}`));
    const { stdout, stderr, error } = await runCommand(
      [
        'publish',
        `--username=${username}`,
        `--password=${password}`,
        `--api=${apiSuffix}`,
        `--on-behalf=${onBehalfUsername}`,
        `--quiet`,
        projectPath,
      ],
      { root }
    );
    assert.equal(stdout, '', 'stdout must be empty');
    assert.equal(stderr, '', 'stderr must be empty');
    assert.equal(error?.oclif?.exit, 0, 'exit code must be zero');
  });

  it(`can publish library on behalf when good username, password from flag set, non-standart api from flag, on-behalf user from flag with with correct trusts, quiet, stderr is empty, stdout is empty, exits with zero code (flags from ENV)`, () =>
    withEnv(
      {
        XOD_USERNAME: username,
        XOD_PASSWORD: password,
        XOD_API: apiSuffix,
        XOD_ONBEHALF: onBehalfUsername,
      },
      async () => {
        postAuthEndpoint(nock(`http://pm.${apiSuffix}`));
        getUserEndpointAnother(nock(`http://pm.${apiSuffix}`));
        getLibEndpointFailed404(nock(`http://pm.${apiSuffix}`));
        putLibEndpoint(nock(`http://pm.${apiSuffix}`));
        postVersionEndpoint(nock(`http://pm.${apiSuffix}`));
        const { stdout, stderr, error } = await runCommand(
          ['publish', `--quiet`, projectPath],
          { root }
        );
        assert.equal(stdout, '', 'stdout must be empty');
        assert.equal(stderr, '', 'stderr must be empty');
        assert.equal(error?.oclif?.exit, 0, 'exit code must be zero');
      }
    ));
};

describe('sdpc publish', () => {
  // working directory
  const wd = createWorkingDirectory('publish');

  // create working directory
  before(() => fs.ensureDirSync(wd));

  afterEach(() => nock.cleanAll());

  // remove working directory
  // unmock TTY status
  after(() => {
    process.stdout.isTTY = isTTY;
    process.stderr.isTTY = isTTY;
    fs.removeSync(wd);
  });

  describe('common', () => {
    it(`shows help in stdout, doesn't print to stderr, exits with 0`, async () => {
      const { stdout, stderr } = await runCommand(['publish', '--help'], {
        root,
      });
      assert.include(stdout, 'PROJECT', 'PROJECT argument not found');
      assert.include(stdout, '--help', '--help flag not found');
      assert.include(stdout, '--password', '--password flag not found');
      assert.include(stdout, '--quiet', '--quiet flag not found');
      assert.include(stdout, '--username', '--username flag not found');
      assert.include(stdout, '--version', '--version flag not found');
      assert.include(stdout, '--api', '--api flag not found');
      assert.include(stdout, '--on-behalf', '--on-behalf flag not found');
      assert.equal(
        stripOclifTestTsWarning(stderr),
        '',
        'stderr should be emply'
      );
    });

    it(`shows version in stdout, doesn't print to stderr and exits with 0`, async () => {
      const { stdout, stderr } = await runCommand(['publish', '--version'], {
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
