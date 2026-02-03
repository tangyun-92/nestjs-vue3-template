/**
 * @name 代理的配置
 * @see 在生产环境 代理是无法生效的，所以这里没有生产环境的配置
 * -------------------------------
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 *
 * @doc https://umijs.org/docs/guides/proxy
 */
export default {
  // 开发环境代理配置
  dev: {
    // localhost:8000/dev-api/** -> http://127.0.0.1:3123/**
    // 前端请求 /dev-api/auth/login，代理会去掉 /dev-api，转发到后端 /auth/login
    '/dev-api/': {
      target: 'http://127.0.0.1:3123',
      changeOrigin: true,
      pathRewrite: { '^/dev-api': '' }, // 去掉 /dev-api 前缀
    },
  },
  /**
   * @name 详细的代理配置
   * @doc https://github.com/chimurai/http-proxy-middleware
   */
  test: {
    // localhost:8000/api/** -> https://preview.pro.ant.design/api/**
    '/api/': {
      target: 'https://proapi.azurewebsites.net',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
  pre: {
    '/api/': {
      target: 'your pre url',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
};
