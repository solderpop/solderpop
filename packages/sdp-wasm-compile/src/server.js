import http from 'http';
import fs from 'fs';
import path from 'path';

// wasm.worker.js fetches the compiled artifacts as URLs (importScripts for
// main.js, an internal fetch/XHR for main.wasm via Emscripten's own
// `locateFile`), not as raw buffers — so the local build output needs to be
// served over http, not just written to disk. A single long-lived server
// on 127.0.0.1 serves a root temp directory; each compile gets its own
// subdirectory under it, keyed by a random id, so repeated Simulate runs
// don't collide or need to tear the server down in between.

const MIME_TYPES = {
  '.js': 'application/javascript',
  '.wasm': 'application/wasm',
};

let serverPromise = null;

// :: Path -> Promise { server :: http.Server, port :: Number } Error
const startServer = root =>
  new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const filePath = path.join(root, decodeURIComponent(req.url));
      if (path.relative(root, filePath).startsWith('..')) {
        res.writeHead(403);
        res.end();
        return;
      }
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end();
          return;
        }
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[path.extname(filePath)] || 'text/plain',
        });
        res.end(data);
      });
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });

// :: Path -> Promise Number Error
export const ensureServer = root => {
  if (serverPromise === null) {
    serverPromise = startServer(root);
  }
  return serverPromise.then(({ port }) => port);
};

// :: Path -> Path -> String -> String
export const artifactUrl = (root, buildDir, port, fileName) =>
  `http://127.0.0.1:${port}/${path.relative(root, path.join(buildDir, fileName))}`;
