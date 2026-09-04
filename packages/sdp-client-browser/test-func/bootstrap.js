/* global browser */

import puppeteer from 'puppeteer';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

import chai from 'chai';
import R from 'ramda';
import config from '../webpack.config.test.cjs';

import { PORT } from './server.config.js';

const { assert } = chai;

const globalVariables = R.pick(['browser', 'assert'], global);

const startServer = () =>
  new Promise((resolve, reject) => {
    const compiler = webpack(config);
    const server = new WebpackDevServer(
      { port: PORT, host: 'localhost' },
      compiler
    );
    compiler.hooks.done.tap('onDone', () => {
      resolve(server);
    });
    server.start().catch((err) => {
      reject(err);
    });
  });

before(async () => {
  global.server = await startServer();
  global.assert = assert;
  global.browser = await puppeteer.launch({
    args: [
      '--no-sandbox', // @see https://github.com/GoogleChrome/puppeteer/issues/290
    ],
    headless: !process.env.XOD_DEBUG_TESTS,
    slowMo: 10,
    timeout: 10000,
  });
});

after(async () => {
  await browser.close();
  await global.server.stop();

  global.browser = globalVariables.browser;
  global.assert = globalVariables.assert;
});
