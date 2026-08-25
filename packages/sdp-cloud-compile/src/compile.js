/* eslint-disable prettier/prettier */
import R from 'ramda';
import btoa from 'btoa';
import fetch from 'node-fetch';
import { createError, notNil } from 'sdp-func-tools';

import arduinoH from 'sdp-tabtest/cpp/Arduino.h';
import arduinoCpp from 'sdp-tabtest/cpp/Arduino.cpp';
import xStringFormatInl from '../../../cpplib/catch2utils/XStringFormat.inl';

import * as EC from './errorCodes.js';

// fetchImpl is injectable (defaults to the real node-fetch) purely so tests
// can exercise the request-building/error-mapping logic below without
// hitting a real compile server. Giving it a default keeps `fetchImpl` out
// of `fn.length`, so R.curry still auto-detects the original 4-ary arity --
// existing 4-arg call sites are unaffected, and tests can still pass a 5th
// arg through explicitly (R.curry forwards args in excess of its detected
// arity straight to the wrapped function).
// :: String -> Nullable String -> StrMap Source -> Object -> Function -> Promise Object Error
export const compile = R.curry((hostname, accessToken, suite, opts, fetchImpl = fetch) => {
  const reqUrl = `https://api.${hostname}/compile/enqueue`;
  const reqBody = R.compose(
    R.merge(opts),
    filesMap => ({
      payload: filesMap,
    }),
    R.map(btoa),
    R.when(
      () => opts.fqbn === 'wasm:tabtest:2',
      R.merge({
        'Arduino.cpp': arduinoCpp,
        'Arduino.h': arduinoH,
        'XStringFormat.inl': xStringFormatInl,
      })
    )
  )(suite);

  const headers = R.when(
    () => notNil(accessToken),
    R.assoc('Authorization', `Bearer ${accessToken}`)
  )({
    'Content-Type': 'application/json',
  });

  return fetchImpl(reqUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(reqBody),
  })
    .catch(err =>
      Promise.reject(createError(EC.WASM_COMPILATION_RESULTS_FETCH_ERROR, { message: err.message }))
    )
    .then(res => {
      if (!res.ok) {
        return res.json()
          .then(json => {
            switch (res.status) {
              case 401: return createError(EC.WRONG_AUTHORIZATION_TOKEN, json);
              case 402: return createError(EC.COMPILATION_LIMIT_EXCEEDED, json);
              case 422: return createError(EC.WASM_COMPILATION_ERROR, json);
              default: return createError(EC.WASM_UNKNOWN_COMPILATION_ERROR, json);
            }
          })
          .catch(() => createError(EC.COMPILATION_SERVICE_ERROR, res.body))
          .then(x => Promise.reject(x));
      }
      return res;
    })
    .then(res => res.json());
});

// `compileTabtest(HOSTNAME, accessToken)` is partially applied at its real
// call site (sdp-client/src/editor/actions.js), so R.curry has to stay --
// same fn.length trick as compile() above to keep the auto-detected arity
// at the original 3 while still allowing a 4th fetchImpl arg for tests.
// :: String -> Nullable String -> StrMap Source -> Function -> Promise
export const compileTabtest = R.curry(
  (hostname, accessToken, suite, fetchImpl = fetch) =>
    compile(
      hostname,
      accessToken,
      suite,
      {
        fqbn: 'wasm:tabtest:2',
        options: {},
      },
      fetchImpl
    )
);

// :: String -> Nullable String -> Source -> Function -> Promise
export const compileSimulation = R.curry(
  (hostname, accessToken, programCode, fetchImpl = fetch) => {
    const suite = {
      'sketch.ino': programCode,
    };
    return compile(
      hostname,
      accessToken,
      suite,
      {
        fqbn: 'wasm:simulation',
        options: {},
      },
      fetchImpl
    );
  }
);
