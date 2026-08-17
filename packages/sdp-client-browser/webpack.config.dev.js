const path = require('path');
/* eslint-disable import/no-extraneous-dependencies */
const webpack = require('webpack');
const { merge } = require('webpack-merge');
/* eslint-enable import/no-extraneous-dependencies */
const baseConfig = require('./webpack.config.js');

const pkgpath = subpath => path.join(__dirname, subpath);

module.exports = merge(baseConfig, {
  devtool: 'eval-source-map',
  output: {
    publicPath: 'http://localhost:8080/',
  },
  // Native fs events are unreliable on some filesystems (containers,
  // network/overlay mounts) and can make webpack's watcher retrigger
  // an identical rebuild in a tight loop. Polling avoids that.
  watchOptions: {
    poll: 1000,
  },
  devServer: {
    hot: true,
    host: 'localhost',
    port: 8080,
    static: {
      directory: pkgpath('dist'),
    },
    compress: true,
    watchFiles: {
      paths: ['**/*'],
      options: {
        usePolling: true,
        interval: 1000,
      },
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.IS_DEV': true,
    }),
  ],
});
