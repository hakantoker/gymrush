const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp)$/i,
        type: 'asset/resource',
        generator: { filename: 'assets/textures/[name][ext]' },
      },
      {
        test: /\.(glb|gltf|fbx|obj)$/i,
        type: 'asset/resource',
        generator: { filename: 'assets/models/[name][ext]' },
      },
      {
        test: /\.(mp3|ogg|wav)$/i,
        type: 'asset/resource',
        generator: { filename: 'assets/audio/[name][ext]' },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      title: '3D Web Game',
    }),
  ],
};
