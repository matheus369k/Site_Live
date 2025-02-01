const webpack = require("webpack");
require('dotenv').config();

module.exports = {
  entry: "./scripts/index.js",
  output: {
    path: __dirname,
    filename: "bundle.js",
    publicPath: "./",
  },
  devServer: {
    static: __dirname,
    compress: true,
    hot: true,
    open: true,
    port: 3000,
    host: "localhost",
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.BACK_END_URL': JSON.stringify(process.env.BACK_END_URL),
    }),
  ],
  module: {
    rules: [
      {
        /* caso use css pelo js
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpg|gif|svg)$/i,
        use: [
          {
            loader: "url-loader",
            options: {
              limit: 8192,
            },
          },
        ],
        */
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [".js", ".css", ".jpg", ".svg"],
  },
};
