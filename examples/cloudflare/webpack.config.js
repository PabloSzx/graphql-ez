const webpack = require('webpack');

const path = require('path');

const mode = process.env.NODE_ENV || 'production';

/**
 * @type {import("webpack").Configuration}
 */
const config = {
  output: {
    filename: `worker.js`,
    path: path.join(__dirname, 'dist'),
    module: true,
  },
  experiments: {
    outputModule: true,
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
  mode,
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    plugins: [],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
        },
      },
    ],
  },
};

module.exports = config;
