const common = require('./config/webpack/webpack.common');
const webpackMerge = require('webpack-merge');

let envConfig;
switch (process.env.NODE_ENV) {
  case 'prod':
  case 'production':
    envConfig = require('./config/webpack/webpack.prod');
    break;
  default:
    envConfig = require('./config/webpack/webpack.dev');
}

module.exports = webpackMerge(common, envConfig);
