/**
 * Basic Webpack Config that could be extended with additional
 * configurations for specific platform (browser / electron).
 *
 * Because of Webpack config should contain some absolute paths (like `dist`),
 * it's a function that accepts one argument: absolute path to specific platform
 * root (`__dirname` in theirs webpack.config.js).
 *
 * Usage:
 * ```
 * const merge = require('webpack-merge');
 * const getBaseConfig = require('sdp-client/webpack.config');
 *
 * merge.smart(getBaseConfig(__dirname), {
 *   entry: [
 *     path.resolve(__dirname, 'src/styles/specificStyles.scss'),
 *   ],
 * });
 * ```
 */

const fs = require('fs');
const path = require('path');
/* eslint-disable import/no-extraneous-dependencies */
const findup = require('findup-sync');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const autoprefixer = require('autoprefixer');
const TerserPlugin = require('terser-webpack-plugin');
/* eslint-enable import/no-extraneous-dependencies */

const pkgpath = (pkgDir, subpath) => path.join(pkgDir, subpath);
const assetsPath = fs.realpathSync(findup('node_modules/sdp-client/src/core/assets'));
const fontAwesomePath = fs.realpathSync(findup('node_modules/font-awesome'));

const IS_DEV = (
  !process.env.NODE_ENV ||
  process.env.NODE_ENV === 'development'
);

module.exports = pkgDir => ({
  mode: IS_DEV ? 'development' : 'production',
  devtool: 'source-map',
  entry: [
    'babel-polyfill',
    findup('node_modules/sdp-client/src/core/styles/main.scss'),
    pkgpath(pkgDir, 'src/shim.js'),
    pkgpath(pkgDir, 'src/index.jsx'),
  ],
  output: {
    filename: 'bundle.js',
    path: pkgpath(pkgDir, 'dist'),
    publicPath: '',
  },
  resolve: {
    extensions: ['.js', '.json', '.jsx'],
    alias: {
      handlebars: 'handlebars/dist/handlebars.js',
      /** @see {@link http://stackoverflow.com/a/32444088} */
      react: findup('node_modules/react'),
    },
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
      },
      {
        include: pkgpath(pkgDir, 'src'),
        test: /\.jsx?$/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-react', '@babel/preset-env'],
        },
      },
      {
        test: /\.worker\.js$/,
        loader: 'worker-loader',
      },
      {
        test: /\.scss$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [autoprefixer()],
              },
            },
          },
          {
            loader: 'sass-loader',
            options: {
              implementation: require('sass'),
              sassOptions: {
                style: 'expanded',
              },
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [autoprefixer()],
              },
            },
          },
        ],
      },
      {
        include: assetsPath,
        test: /\.(jpe?g|png|gif|svg|ttf|eot|woff|woff2)$/,
        type: 'asset/resource',
        generator: {
          // Was file-loader's 'assets/[path][name].[ext]?[hash:6]' with
          // `context: assetsPath` (cache-busting hash as a URL query
          // string, scoped to a flat 'assets/<subpath-under-assetsPath>'
          // layout). Now on webpack 5's built-in asset modules instead of
          // file-loader -- hashed with webpack's own hash implementation
          // rather than file-loader's (via loader-utils, which calls
          // Node's crypto MD4, disabled by OpenSSL 3 on Node 17+ without
          // the legacy-provider flag). Asset modules' `[path]` placeholder
          // has no equivalent to file-loader's scoped `context` option --
          // it's always relative to the whole compilation, which would
          // nest this under 'assets/sdp-client/src/core/assets/...'
          // instead of the flat layout other code (CopyWebpackPlugin's
          // index.html, Electron's packaged resources) expects. A filename
          // function replicates the old scoped-relative-path behavior.
          filename: pathData => {
            const relativeDir = path.relative(assetsPath, path.dirname(pathData.filename));
            return `assets/${relativeDir ? `${relativeDir}/` : ''}[name].[hash:6][ext]`;
          },
        },
      },
      {
        include: fontAwesomePath,
        test: /\.(jpe?g|png|gif|svg|ttf|eot|woff|woff2)(\?\S*)?$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/font-awesome/[name].[hash:6][ext]',
        },
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: findup('node_modules/sdp-client/src/core/assets/index.html') },
        { from: findup('node_modules/sdp-client/src/core/assets/favicon.ico') },
      ],
    }),
  ],
  optimization: {
    minimize: !IS_DEV,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          mangle: false,
          toplevel: true,
          output: {
            webkit: true,
          },
        },
      }),
    ],
  },
});
