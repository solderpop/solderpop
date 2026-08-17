/**
 * In-repo replacement for eslint-plugin-xod-fp (unmaintained npm
 * package, last published for eslint@~3.9.1). Loaded today via
 * classic-config plugin resolution (see package.json's `name` +
 * the `file:` dependency in the root package.json, plus the
 * `plugins: ['sdp-fp']` entry in .eslintrc.js).
 *
 * This same `{ rules }` shape is also what flat config expects for
 * plugin registration -- when this repo's ESLint version is bumped
 * past classic config, register it directly:
 *
 *   const sdpFp = require('./tools/eslint-plugin-sdp-fp');
 *   module.exports = [{ plugins: { 'sdp-fp': sdpFp }, rules: { 'sdp-fp/max-composition-depth': [...] } }];
 *
 * -- no rewrite of this file needed.
 */
const maxCompositionDepth = require('./rules/max-composition-depth');

module.exports = {
  rules: {
    'max-composition-depth': maxCompositionDepth,
  },
};
