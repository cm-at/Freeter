module.exports = {
  appId: 'io.freeter.app.dev',
  productName: 'Freeter Dev',
  artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  files: [{
    from: './build',
    to: './'
  }, {
    from: './',
    to: './',
    filter: ['package.json']
  }],
  mac: {
    category: 'public.app-category.productivity',
    target: [
      {
        target: 'dir',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'resources/darwin/freeter.icns',
  },
  directories: {
    output: 'dist'
  }
} 