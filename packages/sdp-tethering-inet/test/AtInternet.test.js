// Drives real TCP connections/pings against a hardcoded external IP
// (35.184.230.84) and real DNS lookups -- a live-network integration
// check, not a unit test. Mechanically ported for structural parity with
// the old ReasonML+bs-jest version; not verified in this sandbox (same
// treatment as this repo's other network/GUI-dependent test-func suites).
const AtInternet = require('../src/AtInternet.bs.js');

const expectPromiseEq = (label, actual, expected) =>
  test(label, () =>
    actual.then(
      (res) => expect(res).toEqual(expected),
      () => {
        throw new Error(
          `Expected Promise.resolve(${expected}), but got Promise.reject`
        );
      }
    )
  );

const expectPromise = (label, actual, fn) => test(label, () => actual.then(fn));

describe('AtInternet: basic', () => {
  const inetState = AtInternet.getDefaultState();

  test('MUX=false by default', () => {
    expect(AtInternet.isMux(inetState)).toBe(false);
  });

  test('AT+CIPMUX switching', () => {
    const state = AtInternet.getDefaultState();
    return AtInternet.execute(state, 'AT+CIPMUX=1')
      .then((res) => [res, AtInternet.isMux(state)])
      .then((firstRes) =>
        AtInternet.execute(state, 'AT+CIPMUX=0')
          .then((res) => [firstRes, [res, AtInternet.isMux(state)]])
          .then((actual) =>
            expect(actual).toEqual([
              ['OK', true],
              ['OK', false],
            ])
          )
      );
  });
  // TODO: CIPMUX=1 after one established TCP connection should return ERR

  expectPromiseEq('AT -> OK', AtInternet.execute(inetState, 'AT'), 'OK');

  expectPromise('AT+CIFSR', AtInternet.execute(inetState, 'AT+CIFSR'), (res) =>
    expect(res).toMatch(/^\+CIFSR:(STAIP|STAMAC),"([0-9a-z.:]+)"/m)
  );

  // TODO: CIPSTATUS: Very fragile test :-(
  expectPromiseEq(
    'AT+CIPSTATUS',
    AtInternet.execute(inetState, 'AT+CIPSTATUS'),
    'STATUS:2'
  );

  expectPromise(
    'AT+PING',
    AtInternet.execute(inetState, 'AT+PING="google.com"'),
    (res) => expect(res).toMatch(/^\+\d+\nOK/)
  );

  expectPromise(
    'AT+CIPDOMAIN',
    AtInternet.execute(inetState, 'AT+CIPDOMAIN="xod.io"'),
    (res) => expect(res).toMatch(/^\+CIPDOMAIN:[a-z0-9.:]+\nOK/)
  );

  expectPromise(
    'AT+CIPSTART (TCP, single, no keepAlive)',
    AtInternet.execute(inetState, 'AT+CIPSTART="TCP","35.184.230.84",80'),
    (res) =>
      expect([res, AtInternet.hasConnections(inetState)]).toEqual(['OK', true])
  );
  expectPromise(
    'AT+CIPSTART (SSL, single, no keepAlive)',
    AtInternet.execute(inetState, 'AT+CIPSTART="SSL","35.184.230.84",443'),
    (res) =>
      expect([res, AtInternet.hasConnections(inetState)]).toEqual(['OK', true])
  );
  // TODO: Test UDP

  expectPromiseEq(
    'AT+CIPCLOSE of not existing connection',
    AtInternet.execute(inetState, 'AT+CIPCLOSE'),
    'OK'
  );

  test('AT+CIPCLOSE of one connection', () => {
    const state = AtInternet.getDefaultState();
    return AtInternet.execute(
      state,
      'AT+CIPSTART="TCP","35.184.230.84",80'
    ).then((r0) =>
      AtInternet.execute(state, 'AT+CIPCLOSE=0').then((r1) =>
        expect([r0, r1]).toEqual(['OK', 'OK'])
      )
    );
  });

  test('AT+CIPCLOSE of all connection', () => {
    const state = AtInternet.getDefaultState();
    return AtInternet.execute(state, 'AT+CIPMUX=1')
      .then(() =>
        AtInternet.execute(state, 'AT+CIPSTART=0,"TCP","35.184.230.84",80')
      )
      .then(() =>
        AtInternet.execute(state, 'AT+CIPSTART=1,"TCP","35.184.230.84",80')
      )
      .then(() => AtInternet.execute(state, 'AT+CIPCLOSE=5'))
      .then(() => expect(AtInternet.hasConnections(state)).toBe(false));
  });

  test('TCP: Connect and send', () => {
    const state = AtInternet.getDefaultState();
    const request = 'GET /httpbin/now HTTP/1.1\nHost: api.xod.io\n\n';
    const length = String(request.length);
    return AtInternet.execute(state, 'AT+CIPSTART="TCP","35.184.230.84",80')
      .then((r0) =>
        AtInternet.execute(state, `AT+CIPSEND=${length}`).then((r1) => [r0, r1])
      )
      .then(([r0, r1]) =>
        AtInternet.send(state, request).then((r2) =>
          expect([r0, r1, r2]).toEqual([
            'OK',
            'OK\n>',
            'Recv 44 bytes\n\nSEND OK',
          ])
        )
      );
  });

  test('TCP: Connect, send and receive', () => {
    const state = AtInternet.getDefaultState();
    const request = 'GET /httpbin/now HTTP/1.1\nHost: api.xod.io\n\n';
    const length = String(request.length);
    let response = '';
    return new Promise((resolve) => {
      AtInternet.execute(state, 'AT+CIPSTART="TCP","35.184.230.84",80')
        .then(() => AtInternet.execute(state, `AT+CIPSEND=${length}`))
        .then(() => {
          AtInternet.listen(state, 0, (data) => {
            const newResponse = response + data;
            if (/HTTP\/1\.1 200 OK/gm.test(newResponse)) {
              resolve();
            }
            response = newResponse;
          });
          return AtInternet.send(state, request);
        });
    });
  }, 5000);

  test('Stream-like facade', () =>
    new Promise((resolve, reject) => {
      AtInternet.create((answer) => {
        if (answer === 'OK') {
          resolve();
        } else {
          reject(
            new Error(`Expected to get \`OK\` answer, but got \`${answer}\`.`)
          );
        }
      })('AT');
    }));
});
