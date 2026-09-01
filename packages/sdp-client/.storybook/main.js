import path from 'path';
import { fileURLToPath } from 'url';
import autoprefixer from 'autoprefixer';
import sass from 'sass';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsPath = path.resolve(__dirname, '..', 'src/core/assets');

export default {
  stories: ['../stories/**/*.stories.jsx'],
  addons: ['@storybook/addon-actions', '@storybook/addon-webpack5-compiler-babel'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: (config) => {
    config.resolve.extensions.push('.jsx');
    // until https://github.com/wycats/handlebars.js/issues/1102 is resolved
    config.resolve.alias.handlebars = 'handlebars/dist/handlebars.js';

    config.module.rules.push(
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: { plugins: [autoprefixer()] },
            },
          },
          {
            loader: 'sass-loader',
            options: { implementation: sass },
          },
        ],
      },
      {
        include: assetsPath,
        test: /\.(jpe?g|png|gif|svg|ttf|eot|woff|woff2)$/,
        type: 'asset/resource',
        generator: { filename: 'assets/[name].[hash:6][ext]' },
      }
    );

    return config;
  },
};
