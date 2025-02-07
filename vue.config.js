// vue.config.js
const path = require('path')
const pkg = require('./package.json')
const CopywebpackPlugin = require('copy-webpack-plugin')

function resolve(dir) {
  return path.join(__dirname, dir)
}

function newDateVersion() {
  var d = new Date() //获取系统当前时间
  return `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d
    .getDate()
    .toString()
    .padStart(2, '0')}${d.getHours().toString().padStart(2, '0')}`
}
module.exports = {
  publicPath: '.',
  chainWebpack: (config) => {
    config.module.rules.delete('eslint')
  },
  configureWebpack: {
    // Webpack configuration applied to web builds and the electron renderer process
    target: 'electron-renderer',
    resolve: {
      mainFields: ['main', 'browser'],
      alias: {
        '@': resolve('src')
      }
    }
  },

  pluginOptions: {
    chainWebpack: (config) => {
      config.module.rules.delete('eslint')
    },
    electronBuilder: {
      preload: 'src/ui/web3/bridgeClientImpl.js',
      externals: ['electron-screenshots'],
      chainWebpackMainProcess: (config) => {
        // Chain webpack config for electron main process only
        config.module
          .rule('native')
          .test(/\.node$/)
          .use('native-ext-loader')
          .loader('native-ext-loader')
          .end()
        // config.externals({
        //     'electron-screenshots': 'require("electron-screenshots")'
        // });
        config.plugin('copy').use(CopywebpackPlugin, [
          [
            {
              from: `${__dirname}/public/**/*`,
              to: `${__dirname}/dist_electron`
            }
          ]
        ])
      },
      chainWebpackRendererProcess: (config) => {
        // Chain webpack config for electron renderer process only (won't be applied to web builds)
        config.module
          .rule('vue')
          .use('vue-loader')
          .loader('vue-loader')
          .tap((options) => {
            // options.compilerOptions.directives = {
            // 	html(node, directiveMeta) {
            // 		; (node.props || (node.props = [])).push({
            // 			name: 'innerHTML',
            // 			value:
            // 				directiveMeta.value !== 'tipContent'
            // 					? `xss(_s(${directiveMeta.value}),xssOptions())`
            // 					: `_s(${directiveMeta.value})`,
            // 		})
            // 	},
            // }
            options.compilerOptions = {
              compatConfig: {
                MODE: 3
              }
            }
            return options
          })
      },
      // nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      // Use this to change the entrypoint of your app's main process
      // mainProcessFile: 'src/myBackgroundFile.js',
      // Use this to change the entry point of your app's render process. default src/[main|index].[js|ts]
      // rendererProcessFile: 'src/myMainRenderFile.js',
      // Provide an array of files that, when changed, will recompile the main process and restart Electron
      // Your main process file will be added by default
      // mainProcessWatch: ['src/myFile1', 'src/myFile2'],
      // Provide a list of arguments that Electron will be launched with during "electron:serve",
      // which can be accessed from the main process (src/background.js).
      // Note that it is ignored when --debug flag is used with "electron:serve", as you must launch Electron yourself
      // Command line args (excluding --debug, --dashboard, and --headless) are passed to Electron as well
      // mainProcessArgs: ['--arg-name', 'arg-value']
      mainProcessArgs: ['--disable-background-timer-throttling', ''],
      // outputDir: 'release',
      builderOptions: {
        appId: pkg.appId, // appId 用于唯一标识你的应用。这个 ID 在应用发布和更新过程中起到关键作用，
        productName: pkg.chineseName, //定义应用在安装包和系统中的显示名称。这个名称会出现在安装向导、桌面快捷方式等位置。
        copyright: pkg.company, //版权信息
        asar: true, //表示将应用文件打包成asar格式。
        compression: 'normal',
        artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
        protocols: {
          name: 'chainpalpc-deep-linking',
          schemes: ['chainpalpc']
        },
        // #默认读取package.json中的version，可不添加
        buildVersion: newDateVersion(),
        publish: [
          {
            provider: 'generic',
            url: 'https://chat-minio.tongfudun.com/release'
          }
        ],
        mas: {
          type: 'distribution',
          hardenedRuntime: false,
          icon: 'build/icon.icns',
          identity: 'PAYEGIS INC. (L6ECB5JRB2)',
          entitlements: 'build/mas/entitlements.mas.plist',
          entitlementsInherit: 'build/mas/entitlements.mas.inherit.plist',
          entitlementsLoginHelper:
            'build/mas/entitlements.mas.loginhelper.plist', // 如果需要testflight则该项必须
          provisioningProfile: 'build/mas/chainpalpcdis.provisionprofile'
        },
        mac: {
          extendInfo: {
            electronTeamId: 'L6ECB5JRB2',
            NSRemindersUsageDescription: 'Need to access reminder information.', //通知权限
            NSCameraUsageDescription:
              'This app requires camera access to record video.',
            NSMicrophoneUsageDescription:
              'This app requires microphone access to record audio.',
            NSLocalNetworkUsageDescription:
              'This application requires access logs to upload or download files.',
            NSDesktopFolderUsageDescription:
              'This app needs access to your desktop folders so you can browse or upload or download files.',
            NSDocumentsFolderUsageDescription:
              'This app needs access to your Documents folder so you can browse or upload or download files.',
            NSDownloadsFolderUsageDescription:
              'This app needs access to your downloads folder so you can browse or upload or download files.'
          },
          hardenedRuntime: true,
          gatekeeperAssess: false,
          entitlements: 'build/mac/entitlements.mac.plist',
          entitlementsInherit: 'build/mac/entitlements.mac.plist',
          provisioningProfile: 'build/mas/chainpalpcdis.provisionprofile',
          target: [
            'mas',
            'dmg',
            'zip' // 这里注意更新的时候，mac只认zip格式的包
          ]
        },
        linux: {
          category: 'ChainPal',
          executableName: pkg.chineseName,
          target: ['deb', 'AppImage']
        },
        deb: {
          afterInstall: 'entries/install.sh'
        },
        extraResources: [
          {
            from: 'build/icons',
            to: 'extraResources/icons'
          }
        ],
        extraFiles: [
          {
            from: 'entries',
            to: 'entries'
          }
        ],
        win: {
          target: 'nsis',
          requestedExecutionLevel: 'asInvoker'
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          artifactName: '${productName}-${version}-${os}-${arch}-setup.${ext}',
          deleteAppDataOnUninstall: true,
          perMachine: true,
          createDesktopShortcut: true,
          shortcutName: pkg.chineseName,
          include: 'build/installer.nsh'
        }
      }
    }
  }
}
