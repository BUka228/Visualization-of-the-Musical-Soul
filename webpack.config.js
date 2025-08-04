const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    library: 'MusicGalaxy',
    libraryTarget: 'window',
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
    proxy: {
      '/api/music': {
        target: 'https://api.music.yandex.net',
        changeOrigin: true,
        secure: true,
        pathRewrite: {
          '^/api/music': ''
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    }
  },
};