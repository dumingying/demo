
let proPlugins = [];
let pkg = require('./package.json')
if (process.env.NODE_ENV === 'production' && !pkg.appDebug) {
  proPlugins.push(["transform-remove-console", { "exclude": ["error", "warn"] }]);
}
module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset',
  ],
  // Exclude from transpilation
  exclude: [
    /(base64.min.js). /, // Exclude filenames containing `ignoreme`
  ],
  plugins: [...proPlugins]
}
