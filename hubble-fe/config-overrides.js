const { override, addLessLoader, addWebpackAlias, overrideDevServer,watchAll } = require('customize-cra')

const addProxy = () => (configFunction) => {
  configFunction.proxy = {
    '/wjApi/': {
      target: 'http://172.31.164.8:9898/',
      changeOrigin: true,
      pathRewrite: { '^/wjApi/': '/' },
    },
  }

  return configFunction
}

module.exports = {
  webpack: override(
    addLessLoader({
      javascriptEnabled: true,
    }),
    addWebpackAlias({
      '@ui': require('path').resolve(__dirname, './src/components/common/UI'),
    })
  ),
  devServer: overrideDevServer(
    addProxy(),
    watchAll()
)
}
