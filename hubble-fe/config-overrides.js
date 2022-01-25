const {
  override,
  addLessLoader,
  addWebpackAlias,
  overrideDevServer,
  watchAll
} = require('customize-cra');

const addProxy = () => (configFunction) => {
  configFunction.proxy = {
    '/about': {
      target: 'http://172.31.164.8:9898',
      changeOrigin: true
    },
    '/api': {
      target: 'http://172.31.164.8:9898',
      changeOrigin: true
    }
  };

  return configFunction;
};

module.exports = {
  webpack: override(
    addLessLoader({
      javascriptEnabled: true
    }),
    addWebpackAlias({
      '@ui': require('path').resolve(__dirname, './src/components/common/UI')
    })
  ),
  devServer: overrideDevServer(addProxy(), watchAll())
};
