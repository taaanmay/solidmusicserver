const path = require('path')

export default {
  root: path.resolve(__dirname, 'app'),
  build: {
    outDir: '../dist'
  },
  server: {
    port: 8080,
    hot: true
  }
}
