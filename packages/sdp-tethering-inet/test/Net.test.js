'use strict';

// Opens a real TCP connection to a hardcoded external IP -- a live-network
// integration check, not a unit test. Mechanically ported for structural
// parity with the old ReasonML+bs-jest version; not verified in this
// sandbox (same treatment as this repo's other network/GUI-dependent
// test-func suites).
const Net = require('../src/nodejs/Net.bs.js');

describe('Net', () => {
  test(
    'HTTP GET api.xod.io',
    () =>
      new Promise(resolve => {
        const sock = Net.connect(80, '35.184.230.84');
        Net.setTimeout(Net.setKeepAlive(Net.setEncoding(sock, 'utf8'), false, 0), 1000);
        Net.on(sock, 'ready', () => Net.write(sock, 'GET /httpbin/now HTTP/1.1\nHost: api.xod.io\n\n\n'));
        Net.on(sock, 'timeout', () => resolve());
      }),
    5000
  );
});
