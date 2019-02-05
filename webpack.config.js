const Encore = require('@symfony/webpack-encore');

Encore
  .setOutputPath('build/')
  .setPublicPath('/')
  .cleanupOutputBeforeBuild()
  .enableBuildNotifications()
  .enableSourceMaps(!Encore.isProduction())
  .enableVersioning(Encore.isProduction())
  .addEntry('js/app', './src/js/index.js')
  .addStyleEntry('css/app', './src/scss/index.scss')
  .enableSassLoader((options) => {
    // https://github.com/sass/node-sass#options
    options.includePaths = [
      './node_modules'
    ]
  })
  .autoProvidejQuery()
;

module.exports = Encore.getWebpackConfig();
