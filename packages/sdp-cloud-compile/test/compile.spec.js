import chai from 'chai';
import btoa from 'btoa';

// Imports from dist/, not src/: compile.js's `import ... from
// 'sdp-tabtest/cpp/Arduino.h'` only resolves via Babel's inline-import
// transform, which runs at build time. @babel/register hooks Node's
// CommonJS require(), not the native ESM `import()` mocha uses to load
// this "type": "module" package's test files, so it can't intercept and
// transform that import on the fly -- hitting src/ directly fails with
// ERR_UNKNOWN_FILE_EXTENSION on the raw .h file. Matches how `yarn verify`
// already sequences things (build always runs before test).
import { compile, compileTabtest, compileSimulation } from '../dist/compile.js';
import * as EC from '../dist/errorCodes.js';

const { assert } = chai;

const HOSTNAME = 'solderpop.io';

// Builds a fake fetchImpl that resolves with a controlled fetch-Response-like
// object, and records every call so tests can assert on the request that
// compile() actually sent.
const fakeFetch = ({ ok, status, json, body }) => {
  const calls = [];
  const fetchImpl = (url, options) => {
    calls.push({ url, options });
    return Promise.resolve({
      ok,
      status,
      body: body || {},
      json: () => Promise.resolve(json),
    });
  };
  fetchImpl.calls = calls;
  return fetchImpl;
};

const rejects = async (promise) => {
  try {
    await promise;
  } catch (err) {
    return err;
  }
  throw new Error('Expected promise to reject, but it resolved');
};

describe('compile', () => {
  it('resolves with the parsed JSON body on a successful response', () => {
    const fetchImpl = fakeFetch({ ok: true, status: 200, json: { ok: true } });

    return compile(
      HOSTNAME,
      null,
      { 'sketch.ino': 'void setup(){}' },
      { fqbn: 'wasm:simulation', options: {} },
      fetchImpl
    ).then((result) => {
      assert.deepEqual(result, { ok: true });
    });
  });

  it('posts to https://api.<hostname>/compile/enqueue', async () => {
    const fetchImpl = fakeFetch({ ok: true, status: 200, json: {} });

    await compile(
      HOSTNAME,
      null,
      { 'sketch.ino': 'x' },
      { fqbn: 'wasm:simulation', options: {} },
      fetchImpl
    );

    assert.equal(fetchImpl.calls.length, 1);
    assert.equal(
      fetchImpl.calls[0].url,
      `https://api.${HOSTNAME}/compile/enqueue`
    );
    assert.equal(fetchImpl.calls[0].options.method, 'POST');
  });

  it('base64-encodes every file in the suite into the request payload', async () => {
    const fetchImpl = fakeFetch({ ok: true, status: 200, json: {} });

    await compile(
      HOSTNAME,
      null,
      { 'sketch.ino': 'void setup(){}' },
      { fqbn: 'wasm:simulation', options: {} },
      fetchImpl
    );

    const reqBody = JSON.parse(fetchImpl.calls[0].options.body);
    assert.equal(reqBody.payload['sketch.ino'], btoa('void setup(){}'));
    assert.equal(reqBody.fqbn, 'wasm:simulation');
  });

  it('adds an Authorization header when an access token is given', async () => {
    const fetchImpl = fakeFetch({ ok: true, status: 200, json: {} });

    await compile(
      HOSTNAME,
      'my-token',
      { 'sketch.ino': 'x' },
      { fqbn: 'wasm:simulation', options: {} },
      fetchImpl
    );

    assert.equal(
      fetchImpl.calls[0].options.headers.Authorization,
      'Bearer my-token'
    );
  });

  it('omits the Authorization header when no access token is given', async () => {
    const fetchImpl = fakeFetch({ ok: true, status: 200, json: {} });

    await compile(
      HOSTNAME,
      null,
      { 'sketch.ino': 'x' },
      { fqbn: 'wasm:simulation', options: {} },
      fetchImpl
    );

    assert.isUndefined(fetchImpl.calls[0].options.headers.Authorization);
  });

  it('rejects with WRONG_AUTHORIZATION_TOKEN on a 401 response', async () => {
    const fetchImpl = fakeFetch({
      ok: false,
      status: 401,
      json: { message: 'unauthorized' },
    });

    const error = await rejects(
      compile(
        HOSTNAME,
        'bad-token',
        { 'sketch.ino': 'x' },
        { fqbn: 'wasm:simulation', options: {} },
        fetchImpl
      )
    );

    assert.equal(error.type, EC.WRONG_AUTHORIZATION_TOKEN);
  });

  it('rejects with COMPILATION_LIMIT_EXCEEDED on a 402 response', async () => {
    const fetchImpl = fakeFetch({
      ok: false,
      status: 402,
      json: { message: 'limit exceeded' },
    });

    const error = await rejects(
      compile(
        HOSTNAME,
        null,
        { 'sketch.ino': 'x' },
        { fqbn: 'wasm:simulation', options: {} },
        fetchImpl
      )
    );

    assert.equal(error.type, EC.COMPILATION_LIMIT_EXCEEDED);
  });

  it('rejects with WASM_COMPILATION_ERROR on a 422 response', async () => {
    const fetchImpl = fakeFetch({
      ok: false,
      status: 422,
      json: { message: 'bad sketch' },
    });

    const error = await rejects(
      compile(
        HOSTNAME,
        null,
        { 'sketch.ino': 'x' },
        { fqbn: 'wasm:simulation', options: {} },
        fetchImpl
      )
    );

    assert.equal(error.type, EC.WASM_COMPILATION_ERROR);
  });

  it('rejects with WASM_UNKNOWN_COMPILATION_ERROR on an unrecognized error status', async () => {
    const fetchImpl = fakeFetch({
      ok: false,
      status: 500,
      json: { message: 'server error' },
    });

    const error = await rejects(
      compile(
        HOSTNAME,
        null,
        { 'sketch.ino': 'x' },
        { fqbn: 'wasm:simulation', options: {} },
        fetchImpl
      )
    );

    assert.equal(error.type, EC.WASM_UNKNOWN_COMPILATION_ERROR);
  });

  it('rejects with COMPILATION_SERVICE_ERROR when the error response body is not JSON', async () => {
    const fetchImpl = (() => {
      const calls = [];
      const impl = () => {
        calls.push({});
        return Promise.resolve({
          ok: false,
          status: 500,
          body: {},
          json: () => Promise.reject(new Error('not json')),
        });
      };
      impl.calls = calls;
      return impl;
    })();

    const error = await rejects(
      compile(
        HOSTNAME,
        null,
        { 'sketch.ino': 'x' },
        { fqbn: 'wasm:simulation', options: {} },
        fetchImpl
      )
    );

    assert.equal(error.type, EC.COMPILATION_SERVICE_ERROR);
  });

  it('rejects with WASM_COMPILATION_RESULTS_FETCH_ERROR when the request itself fails', async () => {
    const fetchImpl = () => Promise.reject(new Error('network down'));

    const error = await rejects(
      compile(
        HOSTNAME,
        null,
        { 'sketch.ino': 'x' },
        { fqbn: 'wasm:simulation', options: {} },
        fetchImpl
      )
    );

    assert.equal(error.type, EC.WASM_COMPILATION_RESULTS_FETCH_ERROR);
    assert.equal(error.payload.message, 'network down');
  });
});

describe('compileTabtest', () => {
  it('sends fqbn wasm:tabtest:2 and bundles the Arduino tabtest shim files', async () => {
    const fetchImpl = fakeFetch({ ok: true, status: 200, json: {} });

    await compileTabtest(
      HOSTNAME,
      null,
      { 'test.cpp': 'TEST_CASE' },
      fetchImpl
    );

    const reqBody = JSON.parse(fetchImpl.calls[0].options.body);
    assert.equal(reqBody.fqbn, 'wasm:tabtest:2');
    assert.property(reqBody.payload, 'test.cpp');
    assert.property(reqBody.payload, 'Arduino.cpp');
    assert.property(reqBody.payload, 'Arduino.h');
    assert.property(reqBody.payload, 'XStringFormat.inl');
  });
});

describe('compileSimulation', () => {
  it('wraps the program as sketch.ino and sends fqbn wasm:simulation', async () => {
    const fetchImpl = fakeFetch({ ok: true, status: 200, json: {} });

    await compileSimulation(HOSTNAME, null, 'void setup(){}', fetchImpl);

    const reqBody = JSON.parse(fetchImpl.calls[0].options.body);
    assert.equal(reqBody.fqbn, 'wasm:simulation');
    assert.equal(reqBody.payload['sketch.ino'], btoa('void setup(){}'));
    assert.notProperty(reqBody.payload, 'Arduino.cpp');
  });
});
