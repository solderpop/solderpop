/* eslint-disable import/no-extraneous-dependencies */
const { merge } = require('webpack-merge');
const webpack = require('webpack');
/* eslint-enable import/no-extraneous-dependencies */
const getBaseConfig = require('sdp-client/webpack.config.cjs');

module.exports = merge(getBaseConfig(__dirname), {
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.XOD_HM_DEF': JSON.stringify(process.env.XOD_HM_DEF || false),
      'process.env.WHY_DID_YOU_UPDATE': JSON.stringify(process.env.WHY_DID_YOU_UPDATE || false),

      'process.env.XOD_HOSTNAME': JSON.stringify(process.env.XOD_HOSTNAME || 'solderpop.io'),
      'process.env.XOD_SITE_DOMAIN': JSON.stringify(''),
      'process.env.XOD_FORUM_DOMAIN': JSON.stringify('https://forum.solderpop.io/'),
      'process.env.XOD_UTM_SOURCE': JSON.stringify('ide'),
    }),
  ],
});
