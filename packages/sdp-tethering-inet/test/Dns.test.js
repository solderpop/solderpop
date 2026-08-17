'use strict';

// Hits real DNS resolution for google.com -- a live-network integration
// check, not a unit test. Mechanically ported for structural parity with
// the old ReasonML+bs-jest version; not verified in this sandbox (same
// treatment as this repo's other network/GUI-dependent test-func suites).
const Dns = require('../src/nodejs/Dns.bs.js');

const ipRegExp = /^(\d{0,3}\.){3}(\d{0,3})/;

describe('Dns', () => {
  test('Lookup google.com', () => Dns.lookup('google.com').then(res => expect(res).toMatch(ipRegExp)));
});
