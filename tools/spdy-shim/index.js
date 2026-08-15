// Real `spdy` pulls in `http-deceiver`, which calls the removed
// `process.binding('http_parser')` API and crashes at require-time on any
// modern Node.js version. webpack-dev-server@2 requires `spdy`
// unconditionally but only calls `spdy.createServer` when `--https` is
// passed, so a stub is enough for normal (HTTP) dev usage.
exports.createServer = () => {
  throw new Error(
    'spdy is stubbed out (see tools/spdy-shim) and cannot serve HTTPS/HTTP2. ' +
      'Run the dev server over plain HTTP.'
  );
};
