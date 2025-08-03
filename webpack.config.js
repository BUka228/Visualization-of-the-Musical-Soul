const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      title: 'Music Galaxy 3D',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/data/*.json',
          to: 'src/data/[name][ext]',
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
  devServer: {
    static: './dist',
    hot: true,
    open: true,
  },
};