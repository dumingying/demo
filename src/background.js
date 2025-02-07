import fs from "fs";
import tmp from "tmp";
import {
    app,
    BrowserWindow,
    clipboard,
    crashReporter,
    globalShortcut,
    ipcMain,
    Menu,
    nativeImage as NativeImage,
    powerMonitor,
    protocol,
    screen,
    session,
    shell,
    Tray,
    systemPreferences,
} from "electron";
// utiltyProcess 22.0.0 版本才支持
import Screenshots from "electron-screenshots";
import windowStateKeeper from "electron-window-state";
import i18n from "i18n";
import proto from "../marswrapper.node";

import pkg from "../package.json";
import IPCEventType from "./ipcEventType";
import SavePathType from "./savePathType";
import nodePath from "path";
import { init as initProtoMain } from "./wfc/proto/proto_main";
import createProtocol from "./createProtocol";
import dayjs from "dayjs";
import { autoUpdater } from "electron-updater";
import log from "electron-log";
const path = require("path");
const { exec: execCommond } = require("child_process");
// const { spawn } = require("child_process");

// 会议中网络检测
// const childProcess = require('child_process');
// let pingProcess = null

console.log("start crash report", app.getPath("crashDumps"));
crashReporter.start({ uploadToServer: false });
// crashReporter.start({
//     companyName: pkg.company,
//     productName: pkg.name,
//     submitURL: 'https://imndxx_gmail_com.bugsplat.com/post/electron/crash.php',
//     compress: true,
//     ignoreSystemCrashHandler: false,
//     extra: {
//         'key': 'application key',
//         'email': 'user email',
//         'comments': 'comment'
//     }
// })
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    {
        scheme: "app",
        privileges: { secure: true, standard: true, bypassCSP: true },
    },
]);

const isDevelopment = process.env.NODE_ENV !== "production";

const workingDir = isDevelopment ? `${__dirname}/public` : `${__dirname}`;

require("@electron/remote/main").initialize();
let Locales = {};
i18n.configure({
    locales: ["en", "ch"],
    directory: workingDir + "/locales",
    register: Locales,
});
Locales.setLocale("ch");

app.commandLine.appendSwitch("js-flags", "--expose-gc");
process.on("uncaughtException", (error) => {
    console.log("--------uncaughtException-----------", error);
});

let isLoginPage = false;
let forceQuit = false;
let mainWindow;
let fileWindow;
let compositeMessageWindows = new Map();
let previewMediaWindow;
let quickMeetingWindow;
let conversationMessageHistoryMessageWindow;
let messageHistoryMessageWindow;
let conversationWindowMap = new Map();
let screenshots;
let tray;
let trayIcon;
let downloadFileMap = new Map();
let settings = {};
let isFullScreen = false;
let isMainWindowFocusedWhenStartScreenshot = false;
let screenShotWindowId = 0;
let isOsx = process.platform === "darwin";
let isWin = !isOsx;

let isSuspend = false;
let closeWindowToExit = true;
let userData = app.getPath("userData");
let imagesCacheDir = `${userData}/images`;
let voicesCacheDir = `${userData}/voices`;
let downloadCacheDir = `${userData}/download`;
let downloadCloudCacheDir = `${userData}/clouds`;

// mac 可以获取跟随系统
if (isOsx && app.getLocale()) {
    i18n.setLocale(app.getLocale().indexOf("en") > -1 ? "en" : "ch");
} else {
    i18n.setLocale("ch");
}

let mainMenu = [
    {
        label: pkg.chineseName,
        submenu: [
            {
                label: `${Locales.__("Main").About}`,
                selector: "orderFrontStandardAboutPanel:",
            },
            // {
            //     label: Locales.__("Main").Preferences,
            //     accelerator: "Cmd+,",
            //     click() {
            //         mainWindow.show();
            //         mainWindow.webContents.send("show-settings");
            //     }
            // },
            {
                type: "separator",
            },
            {
                role: "hide",
                label: `${Locales.__("Main").Hide}`,
            },
            {
                role: "hideothers",
                label: `${Locales.__("Main").HideOthers}`,
            },
            {
                role: "unhide",
                label: `${Locales.__("Main").Unhide}`,
            },
            // {
            //     label: Locales.__('Main').Check,
            //     accelerator: 'Cmd+U',
            //     click() {
            //         checkForUpdates();
            //     }
            // },
            {
                type: "separator",
            },
            // { label: "copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
            // { label: "paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
            // {
            //     label: "剪切",
            //     role: "paste",
            //     accelerator: "CommandOrControl+X",
            //     selector: "cut:"
            // },
            {
                role: "cut",
                label: Locales.__("Edit").Cut,
                selector: "cut:",
            },
            {
                // role: "copy",
                accelerator: "CmdOrCtrl+C",
                label: Locales.__("Edit").Copy,
                selector: "copy:",
            },
            {
                role: "paste",
                label: Locales.__("Edit").Paste,
                selector: "paste:",
            },
            {
                role: "selectall",
                label: Locales.__("Edit").SelectAll,
                selector: "selectall:",
            },
            {
                type: "separator",
            },
            {
                label: Locales.__("Main").Quit,
                accelerator: "Command+Q",
                selector: "terminate:",
                click() {
                    forceQuit = true;
                    mainWindow = null;
                    disconnectAndQuit();
                },
            },
        ],
    },
    // {
    //     label: Locales.__("File").Title,
    //     submenu: [
    //         {
    //             label: Locales.__("File").New,
    //             accelerator: "Cmd+N",
    //             click() {
    //                 mainWindow.show();
    //                 mainWindow.webContents.send("show-newchat");
    //             }
    //         },
    //         {
    //             label: Locales.__("File").Search,
    //             accelerator: "Cmd+F",
    //             click() {
    //                 mainWindow.show();
    //                 mainWindow.webContents.send("show-search");
    //             }
    //         },
    //         {
    //             type: "separator"
    //         },
    //         {
    //             label: Locales.__("File").InsertEmoji,
    //             accelerator: "Cmd+I",
    //             click() {
    //                 mainWindow.show();
    //                 mainWindow.webContents.send("show-emoji");
    //             }
    //         },
    //         {
    //             type: "separator"
    //         },
    //         {
    //             label: Locales.__("File").Next,
    //             accelerator: "Cmd+J",
    //             click() {
    //                 mainWindow.show();
    //                 mainWindow.webContents.send("show-next");
    //             }
    //         },
    //         {
    //             label: Locales.__("File").Prev,
    //             accelerator: "Cmd+K",
    //             click() {
    //                 mainWindow.show();
    //                 mainWindow.webContents.send("show-previous");
    //             }
    //         }
    //     ]
    // },
    // {
    //     label: Locales.__("Conversations").Title,
    //     submenu: [
    //         {
    //             label: Locales.__("Conversations").Loading
    //         }
    //     ]
    // },
    // {
    //     label: Locales.__("Contacts").Title,
    //     submenu: [
    //         {
    //             label: Locales.__("Contacts").Loading
    //         }
    //     ]
    // },
    // {
    //     label: Locales.__("Edit").Title,
    //     submenu: [
    // {
    //     role: "undo",
    //     label: Locales.__("Edit").Undo
    // },
    // {
    //     role: "redo",
    //     label: Locales.__("Edit").Redo
    // },
    // {
    //     type: "separator"
    // },
    // {
    //     role: "cut",
    //     label: Locales.__("Edit").Cut
    // },
    // {
    //     role: "copy",
    //     label: Locales.__("Edit").Copy
    // },
    // {
    //     role: "paste",
    //     label: Locales.__("Edit").Paste
    // },
    // {
    //     role: "pasteandmatchstyle",
    //     label: Locales.__("Edit").PasteMatch
    // },
    // {
    //     role: "delete",
    //     label: Locales.__("Edit").Delete
    // },
    // {
    //     role: "selectall",
    //     label: Locales.__("Edit").SelectAll
    // },
    //     ]
    // },
    // {
    //     label: Locales.__("View").Title,
    //     submenu: [
    //         {
    //             label: isFullScreen
    //                 ? Locales.__("View").ExitFull
    //                 : Locales.__("View").EnterFull,
    //             accelerator: "Shift+Cmd+F",
    //             click() {
    //                 isFullScreen = !isFullScreen;

    //                 mainWindow.show();
    //                 mainWindow.setFullScreen(isFullScreen);
    //             }
    //         },
    // {
    //     label: Locales.__("View").ToggleConversations,
    //     accelerator: "Shift+Cmd+M",
    //     click() {
    //         mainWindow.show();
    //         mainWindow.webContents.send("show-conversations");
    //     }
    // },
    // {
    //     type: "separator"
    // },
    // {
    //     type: "separator"
    // },
    // {
    //     role: "toggledevtools",
    //     label: Locales.__("View").ToggleDevtools
    // },
    //         {
    //             role: "togglefullscreen",
    //             label: Locales.__("View").ToggleFull
    //         }
    //     ]
    // }
    // {
    //     lable: Locales.__("Window").Title,
    //     role: "window",
    //     submenu: [
    //         {
    //             lable: Locales.__("Window").Min,
    //             role: "minimize"
    //         },
    //         {
    //             lable: Locales.__("Window").Close,
    //             role: "close"
    //         }
    //     ]
    // }
    // {
    // lable: Locales.__("Help").Title,
    // role: "help",
    // submenu: [
    // {
    //     label: "链上会",
    //     click() {
    //         shell.openExternal("https://chainpal.tongfudun.com");
    //     }
    // }
    // {
    //     label: Locales.__("Help").Fork,
    //     click() {
    //         shell.openExternal(
    //             "https://github.com/wildfirechat/vue-pc-chat"
    //         );
    //     }
    // },
    // {
    //     type: "separator"
    // },
    // {
    //     role: "reload",
    //     label: Locales.__("Help").Reload
    // },
    // {
    //     role: "forcereload",
    //     label: Locales.__("Help").ForceReload
    // }
    // ]
    // }
];
let trayMenu = [
    {
        label: Locales.__("Main").ChangeWindow,
        click() {
            let isVisible = mainWindow.isVisible();
            isVisible ? mainWindow.hide() : mainWindow.show();
        },
    },
    {
        type: "separator",
    },
    // {
    //     label: Locales.__('Help').Fork,
    //     click() {
    //         shell.openExternal('https://github.com/wildfirechat/vue-pc-chat');
    //     }
    // },
    // {
    //     label: Locales.__('View').ToggleDevtools,
    //     accelerator: 'Alt+Command+I',
    //     click() {
    //         mainWindow.show();
    //         mainWindow.toggleDevTools();
    //     }
    // },
    // {
    //     type: 'separator'
    // },
    {
        label: Locales.__("Main").Quit,
        accelerator: "Command+Q",
        selector: "terminate:",
        click() {
            forceQuit = true;
            mainWindow = null;
            //解决关闭应用闪现登录页面问题
            proto.setConnectionStatusListener(() => {});
            proto.disconnect(0);
            let timer = setTimeout(() => {
                app.exit(0);
                timer && clearTimeout(timer);
            }, 1000);
        },
    },
];

// 外链呼起app
let deepLinkData = {
    joinConference: "open-conference",
    openUrl: "open-web3",
    showChannelInfo: "open-channelInfo",
};

let blink = null;
const updateURL = `https://chat-minio.tongfudun.com/release`;

function handleUpdate() {
    // 设置是否自动下载，默认是true,当点击检测到新版本时，会自动下载安装包，所以设置为false
    autoUpdater.autoDownload = true;
    // https://github.com/electron-userland/electron-builder/issues/1254
    if (process.env.NODE_ENV === "development") {
        console.log(
            "【开发环境】配置文件路径:",
            path.join(__dirname, "default-app-update.yml")
        );
        // autoUpdater.updateConfigPath = path.join(__dirname, 'default-app-update.yml')
        // autoUpdater.updateConfigPath = path.join(__dirname, 'latest-mac.yml')
    } else {
        console.log(
            "【生产】配置文件路径:",
            path.join(__dirname, "../app-update.yml")
        );
        autoUpdater.updateConfigPath = path.join(
            __dirname,
            "../app-update.yml"
        );
    }
    autoUpdater.setFeedURL(updateURL);
    // 当更新发生错误的时候触发
    autoUpdater.on("error", function (error) {
        console.log("on error");
        log.error("error", error);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("update-error", error);
        }
    });
    //当开始检查更新的时候触发。
    autoUpdater.on("checking-for-update", function (info) {
        console.log("on checking-for-update");
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("checking-for-update", info);
        }
    });
    //当有可用更新的时候触发。 更新将自动下载。
    autoUpdater.on("update-available", function (info) {
        console.log("on update-available");
        if (mainWindow && !mainWindow.isDestroyed()) {
            // 通知渲染进程有更新
            mainWindow.webContents.send("update-available", info);
        }
    });
    //当没有可用更新的时候触发。
    autoUpdater.on("update-not-available", function (info) {
        // log.warn("update-not-available", info);
        if (mainWindow && !mainWindow.isDestroyed()) {
            // 通知渲染进程有更新
            mainWindow.webContents.send("update-not-available", info);
        }
    });

    // 更新下载进度事件
    autoUpdater.on(
        "download-progress",
        function (
            progressOb = {
                bytesPerSecond: 47132710,
                delta: 39780007,
                percent: 100,
                total: 39780007,
                transferred: 39780007,
            }
        ) {
            console.log("触发下载。。。");
            // log.warn("download-progress", progressOb);
            if (mainWindow && !mainWindow.isDestroyed()) {
                // 通知下载进度
                mainWindow.webContents.send("download-progress", progressOb);
            }
        }
    );
    //在更新下载完成的时候触发。
    autoUpdater.on("update-downloaded", function () {
        console.log(">>>>>> update downloaded", "开始更新");
        // 下载完直接安装
        forceQuit = true;
        autoUpdater.quitAndInstall();
        const timer = setTimeout(function () {
            mainWindow.webContents.send("update-downloaded");
            if (mainWindow && mainWindow.isDestroyed) {
                mainWindow.isDestroyed();
            }
            timer && clearTimeout(timer);
        }, 1000);

        // log.warn(" update downloaded", autoUpdater.quitAndInstall);
    });
    // 执行自动更新检查
    ipcMain.on("checkForUpdate", () => {
        if (process.mas && isOsx) {
            let appStoreLink = "https://apps.apple.com/cn/app/id1635723004";
            // spawn("open", [appStoreLink]); // 网页
            shell.openExternal(appStoreLink); // appstore
        } else {
            console.log("执行自动更新检查", __dirname);
            autoUpdater.checkForUpdates().then((res) => {
                console.log(res, res, "updateInfo");
            });
        }
    });
    ipcMain.on("downloadUpdate", () => {
        // 下载
        console.log("执行下载");
        autoUpdater.downloadUpdate();
    });
}

function updateTray(unread = 0) {
    settings.showOnTray = true;
    // linux 系统不支持 tray
    if (process.platform === "linux") {
        return;
    }

    if (settings.showOnTray) {
        if (tray && updateTray.lastUnread === unread) {
            return;
        }

        let contextmenu = Menu.buildFromTemplate(trayMenu);
        if (!trayIcon) {
            let iconPath;
            if (!isOsx) {
                iconPath = `${workingDir}/images/icon.png`;
            } else {
                iconPath = `${workingDir}/images/tray.png`;
            }
            trayIcon = NativeImage.createFromPath(iconPath);
        }

        // Make sure the last tray has been destroyed
        setTimeout(() => {
            if (!tray) {
                // Init tray icon
                tray = new Tray(trayIcon);
                if (process.platform === "linux") {
                    tray.setContextMenu(contextmenu);
                }

                tray.on("right-click", () => {
                    tray.popUpContextMenu(contextmenu);
                });

                tray.on("click", () => {
                    mainWindow.show();
                });
            }

            if (isOsx) {
                tray.setTitle(unread > 0 ? " " + unread : "");
            }

            tray.setImage(trayIcon);
            execBlink(unread > 0);
            // Avoid tray icon been recreate
            updateTray.lastUnread = unread;
        });
    } else {
        if (!tray) return;

        // if (!isOsx) {
        tray.destroy();
        // }
        tray = null;
    }
}

function createMenu() {
    var menu = Menu.buildFromTemplate(mainMenu);

    if (isOsx) {
        Menu.setApplicationMenu(menu);
    } else {
        mainWindow.setMenu(null);
    }
}

function regShortcut() {
    // debug
    if (pkg.appDebug) {
        globalShortcut.register("CommandOrControl+G", () => {
            mainWindow.webContents.toggleDevTools();
        });
    }

    globalShortcut.register("CommandOrControl+shift+a", () => {
        isMainWindowFocusedWhenStartScreenshot = mainWindow.isFocused();
        screenshots.startCapture();
    });
    // 调试用，主要用于处理 windows 不能打开子窗口的控制台
    // 打开所有窗口控制台
    // globalShortcut.register("ctrl+shift+i", () => {
    //     let windows = BrowserWindow.getAllWindows();
    //     windows.forEach(win => win.openDevTools());
    // });

    globalShortcut.register("ctrl+shift+d", () => {
        let heapdump = require("@nearform/heap-profiler");
        console.log("generateHeapSnapshot dir", __dirname);
        heapdump.generateHeapSnapshot(
            {
                destination: __dirname + "/" + Date.now() + ".heapsnapshot",
            },
            (err) => {
                console.log("generateHeapSnapshot cb", err);
            }
        );
    });
}
// 处理历史文件夹
const fileDisplay = (filePath) => {
    fs.readdir(filePath, (err, files) => {
        if (err) return;
        files.forEach((filename) => {
            let firstFilesPath = path.join(filePath, `/${filename}`);
            let diffDay = dayjs().diff(dayjs(filename), "day");
            if (diffDay > 1) {
                // 低版本需要删除文件再删除文件夹, node 18 直接删除
                fs.rmdirSync(firstFilesPath, { recursive: true });
            }
        });
    });
};

const downloadHandler = async (event, item, webContents) => {
    // 设置保存路径,使Electron不提示保存对话框。
    // item.setSavePath('/tmp/save.pdf')
    let url = encodeURI(decodeURI(item.getURL())); // 解决转码不一致问题
    let downloadFileInfo = downloadFileMap.get(url);
    if (downloadFileInfo) {
        const { isOpen, userId, fileName, fromTarget, savePath } =
            downloadFileInfo;
        if (isOpen) {
            let localPath = null;
            let dateFile = dayjs().format("YYYY-MM-DD");
            if (savePath === SavePathType.Clouds) {
                localPath = `/clouds/${userId}/${dateFile}`;
            } else if (savePath === SavePathType.Meeting) {
                localPath = `/download/${userId}/meeting/${dateFile}`;
            } else {
                localPath = `/download/${userId}/message/${fromTarget}`;
            }
            let userDataPath = app.getPath("userData");
            const filePath = path.join(
                userDataPath,
                localPath,
                item.getFilename()
            );
            let newFilePath = filePath;
            if (savePath !== SavePathType.Message && !fs.existsSync(filePath)) {
                fileDisplay(
                    path.join(
                        userDataPath,
                        savePath === SavePathType.Clouds
                            ? `/clouds/${userId}`
                            : `/download/${userId}/meeting`
                    )
                );
            }
            // 消息内预览文件，文件重名，添加后缀时间戳
            if (filePath && fs.existsSync(filePath)) {
                let format = path.extname(item.getFilename());
                let name = path.basename(item.getFilename(), format);
                newFilePath = path.join(
                    app.getPath("userData"),
                    localPath,
                    `${name}(${dayjs().format("YYYYMMDDHHmmss")})${format}`
                );
                item.setSavePath(newFilePath);
            } else {
                item.setSavePath(newFilePath);
            }
        }
        // 设置保存类型
        let filters = [{ name: "All Files", extensions: ["*"] }];
        let ext = path.extname(fileName); // 获取扩展名
        if (ext && ext !== ".") {
            const name = ext.slice(1, ext.length);
            filters.unshift({
                name: name.toLocaleUpperCase(),
                extensions: [name],
            });
        }
        item.setSaveDialogOptions({ defaultPath: fileName, filters });
    }
    item.on("updated", (event, state) => {
        try {
            if (state === "interrupted") {
                console.log("Download is interrupted but can be resumed");
                item.cancel();
            } else if (state === "progressing") {
                if (item.isPaused()) {
                    console.log("Download is paused");
                } else {
                    let downloadFile = downloadFileMap.get(url);
                    if (downloadFile && downloadFile.messageUid) {
                        webContents.send("file-download-progress", {
                            messageUid: downloadFile.messageUid,
                            receivedBytes: item.getReceivedBytes(),
                            totalBytes: item.getTotalBytes(),
                        });
                    }
                }
            }
        } catch (e) {
            console.log("downloadHandler updated error", e);
        }
    });
    item.once("done", (event, state) => {
        try {
            let downloadFile = downloadFileMap.get(url);
            if (!downloadFile) {
                return;
            }
            let messageUid = downloadFile.messageUid;
            if (state === "completed") {
                console.log("Download successfully");
                let savePath = item.getSavePath(); // 储存的文件路径
                if (messageUid) {
                    webContents.send("file-downloaded", {
                        messageUid,
                        filePath: savePath,
                    });
                }
                // 打开文件
                if (downloadFile.isOpen) {
                    shell.openPath(savePath);
                }
            } else {
                if (messageUid) {
                    webContents.send("file-download-failed", { messageUid });
                }
                console.log(`Download failed: ${state}`);
            }
            downloadFileMap.delete(url);
        } catch (e) {
            console.log("downloadHandler done error", e);
        }
    });
};

const createMainWindow = async () => {
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1080,
        defaultHeight: 720,
    });

    mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: 300,
        height: 420,
        minWidth: 300,
        minHeight: 420,
        opacity: 0,
        titleBarStyle: "hidden",
        maximizable: false,
        resizable: false,
        backgroundColor: "none",
        // 以下两属性设置时会导致win不能正常unmaximize. electron bug
        // transparent: true,
        // resizable: false,
        webPreferences: {
            scrollBounce: false,
            nodeIntegration: true,
            contextIsolation: false,
            nativeWindowOpen: true,
            webSecurity: false,
            webviewTag: true,
        },
        frame: !isWin,
        icon,
        show: false,
    });
    mainWindow.center();
    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
        // if (!process.env.IS_TEST) mainWindow.webContents.openDevTools()
    } else {
        createProtocol("app");
        // Load the index.html when not in development
        mainWindow.loadURL("app://./index.html");
    }
    require("@electron/remote/main").enable(mainWindow.webContents);
    mainWindow.webContents.on("did-finish-load", (e) => {
        try {
            mainWindow.show();
            mainWindow.focus();
            setTimeout(() => mainWindow.setOpacity(1), 1000 / 60);
            // log.warn('应用启动------->', process.argv)
            if (process.argv.length > 1) {
                // log.warn('浏览器启动------>', process.argv)
                // mainWindow.webContents.send('open-conference', process.argv[1]);
                if (!app.isReady()) {
                    app.once("browser-window-created", () => {
                        // log.warn('等待主窗口初始化完成....')
                        // app 未打开时，通过 open-url打开 app，此时可能还没 ready，需要延迟发送事件
                        // 此段ready延迟无法触发 service/app/ open-url 处理，因为saga初始化需要时间
                        app.emit("second-instance", null, process.argv);
                    });
                } else {
                    // log.warn('主窗口初始化已经完成...')
                    app.emit("second-instance", null, process.argv);
                }
            }
            //获取系统语言，
            let sysLang = app.getLocale().indexOf("en") > -1 ? "en" : "ch";
            mainWindow && mainWindow.webContents.send("sys-language", sysLang);
        } catch (ex) {
            // do nothing
        }
    });

    mainWindow.webContents.on("new-window", (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });

    mainWindow.webContents.on("will-navigate", (event, url) => {
        // console.log("will-navigate", url);
        // do default action
        // event.preventDefault();
        // shell.openExternal(url);
    });
    //秘密令牌快捷键 Command shift
    mainWindow.webContents.on("before-input-event", (event, input) => {
        // console.log(input);
        // {
        //   type: 'keyDown',
        //   key: 'd',
        //   code: 'KeyD',
        //   isAutoRepeat: false,
        //   isComposing: false,
        //   shift: false,
        //   control: false,
        //   alt: false,
        //   meta: true
        // }
        // mac : Command + d
        // window : Shift + d
        if (
            ((input.meta && isOsx) || (input.shift && isWin)) &&
            input.key.toLowerCase() === "d"
        ) {
            event.preventDefault();
            console.log("Pressed Command+d", isOsx, "Shift+d", isWin);
            mainWindow.webContents.send(
                "before-inputEvent-electron",
                isOsx ? "Pressed Command+d" : "Shift+d"
            );
        }
    });

    mainWindow.onbeforeunload = (e) => {
        console.log("I do not want to be closed");
        // 与通常的浏览器不同,会提示给用户一个消息框,
        //返回非空值将默认取消关闭
        //建议使用对话框 API 让用户确认关闭应用程序.
        e.returnValue = false;
    };
    mainWindow.on("close", (e) => {
        if (forceQuit || !tray || closeWindowToExit || isLoginPage) {
            mainWindow = null;
            disconnectAndQuit();
        } else {
            e.preventDefault();
            if (mainWindow.isFullScreen()) {
                mainWindow.setFullScreen(false);
                mainWindow.once("leave-full-screen", () => mainWindow.hide());
            } else {
                mainWindow.hide();
            }
        }
    });

    mainWindow.webContents.session.on("will-download", downloadHandler);

    ipcMain.on("screenshots-start", (event, args) => {
        screenShotWindowId = event.sender.id;
        screenshots.startCapture();
    });

    ipcMain.on("voip-message", (event, args) => {
        mainWindow && mainWindow.webContents.send("voip-message", args);
    });

    ipcMain.on("update-call-start-message", (event, args) => {
        mainWindow &&
            mainWindow.webContents.send("update-call-start-message", args);
    });

    ipcMain.on("conference-request", (event, args) => {
        mainWindow && mainWindow.webContents.send("conference-request", args);
    });

    ipcMain.on(IPCEventType.START_SCREEN_SHARE, (event, args) => {
        let pointer = screen.getCursorScreenPoint();
        let display = screen.getDisplayNearestPoint(pointer);
        mainWindow &&
            mainWindow.webContents.send(IPCEventType.START_SCREEN_SHARE, {
                width: display.size.width,
            });
    });

    ipcMain.on(IPCEventType.STOP_SCREEN_SHARE, (event, args) => {
        mainWindow &&
            mainWindow.webContents.send(IPCEventType.STOP_SCREEN_SHARE, args);
    });

    ipcMain.on(IPCEventType.CLICK_NOTIFICATION, (event, args) => {
        let targetMediaSourceId = args;
        let targetWin = null;
        if (mainWindow.getMediaSourceId() === targetMediaSourceId) {
            targetWin = mainWindow;
        } else {
            for (let win of conversationWindowMap.values()) {
                if (win.getMediaSourceId() === targetMediaSourceId) {
                    targetWin = win;
                    break;
                }
            }
        }
        if ((targetWin && !targetWin.isVisible()) || targetWin.isMinimized()) {
            targetWin.show();
            targetWin.focus();
        }
    });

    ipcMain.on("exec-blink", (event, args) => {
        var isBlink = args.isBlink;
        execBlink(isBlink, args.interval);
    });

    ipcMain.on(IPCEventType.UPDATE_BADGE, (event, args) => {
        let count = args;
        //if (settings.showOnTray) {
        updateTray(count);
        app.badgeCount = count;
        //}
    });
    app.on("remote-require", (event, args) => {
        // event.preventDefault();
        event.returnValue = require("@electron/remote/main");
    });

    ipcMain.on(IPCEventType.FILE_PASTE, (event) => {
        let args = { hasImage: false };

        if (process.platform !== "linux") {
            const clipboardEx = require("electron-clipboard-ex");
            // only support windows and mac
            if (clipboardEx) {
                const filePaths = clipboardEx.readFilePaths();
                if (filePaths && filePaths.length > 0) {
                    args = { files: [] };
                    filePaths.forEach((path) => {
                        let stat = fs.lstatSync(path); //
                        // 通过node的 fs 判断  true || false 判断是不是文件夹
                        if (!stat.isDirectory()) {
                            args.files.push({
                                path: path,
                                name: nodePath.basename(path),
                                size: fs.statSync(path).size,
                            });
                        }
                    });
                }
            }
            args.hasFile = args.files && args.files.length > 0;
        }

        if (!args.hasFile) {
            let image = clipboard.readImage();
            if (!image.isEmpty()) {
                let filename = tmp.tmpNameSync() + ".png";
                args = {
                    hasImage: true,
                    filename: filename,
                    raw: image.toPNG(),
                };

                fs.writeFileSync(filename, image.toPNG());
            }
        }

        event.returnValue = args;
    });
    /**
     * @description: 消息内的文件打开，或下载，需要处理下载进度等 必传参数 messageUid
     * @param {Object}
     * isOpen: 默认打开 切换 设置保存路径 ,
     */
    ipcMain.on(IPCEventType.DOWNLOAD_FILE, async (event, args) => {
        let {
            remotePath,
            messageUid,
            windowId,
            userId,
            fileName,
            isOpen,
            fromTarget,
            savePath,
        } = args;
        // remotePath = remotePath.replace(':80', '');
        downloadFileMap.set(encodeURI(remotePath), {
            messageUid,
            userId,
            fileName,
            windowId,
            isOpen,
            fromTarget,
            savePath,
        });
        let windows = BrowserWindow.getAllWindows();
        windows.forEach((w) => {
            if (w.getMediaSourceId() === windowId) {
                w.webContents && w.webContents.downloadURL(remotePath);
            }
        });
    });
    /**
     * @description: 功能：文件仅下载 或 下载后打开
     * @param {Object} {fileName:String,url:String,windowId:String,userId:String,isDefault:Boolean}
     * isOpen: 默认打开且设置保存路径 ,
     * savePath: 默认下载
     */
    ipcMain.on("file-other-download", async (event, args) => {
        let { fileName, url, windowId, userId, savePath, isOpen } = args;
        downloadFileMap.set(encodeURI(url), {
            windowId,
            userId,
            fileName,
            isOpen,
            savePath,
        });

        let windows = BrowserWindow.getAllWindows();
        windows.forEach((w) => {
            if (w.getMediaSourceId() === windowId) {
                w.webContents && w.webContents.downloadURL(url);
            }
        });
    });

    ipcMain.on(IPCEventType.SHOW_FILE_WINDOW, async (event, args) => {
        if (!fileWindow) {
            let win = createWindow(args.url, 960, 600, 640, 400, true, true);
            // debug
            // win.webContents.openDevTools();
            win.on("close", () => {
                fileWindow = null;
            });
            win.webContents.session.on("will-download", downloadHandler);
            win.show();
            fileWindow = win;
        } else {
            fileWindow.show();
            fileWindow.focus();
        }
    });
    ipcMain.on(
        IPCEventType.SHOW_COMPOSITE_MESSAGE_WINDOW,
        async (event, args) => {
            let messageUid = args.messageUid;
            let compositeMessageWin = compositeMessageWindows.get(messageUid);
            if (!compositeMessageWin) {
                let url = messageUid
                    ? args.url + ("?messageUid=" + messageUid)
                    : args.url;
                let win = createWindow(url, 900, 850, 900, 600, false, false);
                messageUid && compositeMessageWindows.set(messageUid, win);
                // win.webContents.openDevTools();
                win.on("close", () => {
                    messageUid && compositeMessageWindows.delete(messageUid);
                });
                win.show();
            } else {
                compositeMessageWin.show();
                compositeMessageWin.focus();
            }
        }
    );
    // 解决 轻应用内部页面跳转，会出现新窗口的问题 webview 新增打开 阻止一下
    app.on("web-contents-created", (event, contents) => {
        if (contents.getType() === "webview") {
            contents.on("new-window", (event) => {
                event.preventDefault();
            });
        }
    });

    // 查看图片窗口
    ipcMain.on("show-previewMedia-window", (event, args) => {
        previewMediaWindow && previewMediaWindow.close();
        if (!previewMediaWindow) {
            previewMediaWindow = createWindow(
                args.url,
                960,
                600,
                640,
                400,
                true,
                true
            );
            if (pkg.appDebug) {
                // debug
                previewMediaWindow.webContents.openDevTools();
            }
            previewMediaWindow.on("close", () => {
                previewMediaWindow = null;
            });
            previewMediaWindow.center();
        }
        if (previewMediaWindow) {
            previewMediaWindow.webContents.on("did-finish-load", () => {
                previewMediaWindow.webContents.send(
                    "show-preview-window",
                    args
                );
                previewMediaWindow.show();
                previewMediaWindow.focus();
            });
        }
    });

    ipcMain.on(
        IPCEventType.showConversationMessageHistoryPage,
        async (event, args) => {
            if (!conversationMessageHistoryMessageWindow) {
                let url =
                    args.url +
                    `?type=${args.type}&target=${args.target}&line=${args.line}`;
                conversationMessageHistoryMessageWindow = createWindow(
                    url,
                    960,
                    600,
                    640,
                    400,
                    false
                );
                conversationMessageHistoryMessageWindow.on("close", () => {
                    conversationMessageHistoryMessageWindow = null;
                });
                conversationMessageHistoryMessageWindow.show();
            } else {
                let url =
                    args.url +
                    `?type=${args.type}&target=${args.target}&line=${args.line}`;
                try {
                    await conversationMessageHistoryMessageWindow.loadURL(url);
                } catch (e) {
                    // 不知道为啥，loadURL 会失败，reload 就好了
                    conversationMessageHistoryMessageWindow.reload();
                }
                conversationMessageHistoryMessageWindow.show();
                conversationMessageHistoryMessageWindow.focus();
            }
            if (pkg.appDebug) {
                conversationMessageHistoryMessageWindow.webContents.openDevTools();
            }
        }
    );

    ipcMain.on(IPCEventType.showMessageHistoryPage, async (event, args) => {
        if (!messageHistoryMessageWindow) {
            messageHistoryMessageWindow = createWindow(
                args.url,
                960,
                600,
                640,
                400,
                false
            );
            messageHistoryMessageWindow.on("close", () => {
                messageHistoryMessageWindow = null;
            });
        } else {
            messageHistoryMessageWindow.reload();
        }

        messageHistoryMessageWindow.webContents.on("did-finish-load", (e) => {
            messageHistoryMessageWindow.webContents.send(
                "sendHistoryMessageWindowQuery",
                { query: args.query }
            );
            messageHistoryMessageWindow.show();
            messageHistoryMessageWindow.focus();
        });
        if (pkg.appDebug) {
            messageHistoryMessageWindow.webContents.openDevTools();
        }
    });
    ipcMain.on("message-history-openUrl", (event, arg) => {
        mainWindow &&
            mainWindow.webContents.send("message-history-openUrl", arg);
    });

    // 麦克风，摄像头,屏幕录制 权限校验
    ipcMain.handle("media-devices-permissions", async (event, device) => {
        // microphone = 'microphone', // 麦克风
        // camera = 'camera', // 相机
        console.log(`receive message from render: ${device}`);
        if (process.platform === "linux") return;
        const devicePrivilege = systemPreferences.getMediaAccessStatus(device);
        if (devicePrivilege !== "granted") {
            try {
                let granted = await systemPreferences.askForMediaAccess(device);
                if (granted) {
                    console.log("用户授予相机权限");
                    // 在这里可以进行后续操作，如打开相机相关功能
                    return true;
                } else {
                    // 未授权,则重新唤起系统弹框,等待用户点击授权
                    console.log("用户未授予相机权限");
                    return false;
                }
            } catch (error) {
                console.log(error);
                return false;
            }
        }
        return true;
    });
    // 去开通麦克风，摄像头,屏幕录制权限
    ipcMain.on("media-devices-permissions-callback", (event, device) => {
        // 构建要执行的AppleScript命令  'osascript -e \'tell application "System Preferences" to reveal anchor "Privacy" in pane "com.apple.preferences.security"\'' 无效？？？
        const deviceType = isOsx
            ? {
                  camera: "Privacy_Camera",
                  microphone: "Privacy_Microphone",
                  screen: "Privacy_ScreenCapture",
              }
            : {
                  camera: "privacy-webcam",
                  microphone: "privacy-microphone",
                  screen: "privacy-screenCapture",
              };
        let url = isOsx
            ? `open x-apple.systempreferences:com.apple.preference.security?${deviceType[device]}`
            : `start ms-settings:${deviceType[device]}`;

        execCommond(url, (error) => {
            if (error) {
                console.error("无法唤起Mac系统隐私面板：", error);
                mainWindow &&
                    mainWindow.webContents.send(
                        "media-devices-permissions-error",
                        error
                    );
            }
        });
    });

    // 直接在ui层处理了
    // ipcMain.on('open-file', async (event, filename) => {
    //     shell.openPath(filename);
    // });
    //
    // ipcMain.on('open-folder', async (event, dir) => {
    //     shell.openPath(dir);
    // });

    ipcMain.on("open-map", (event, args) => {
        event.preventDefault();
        shell.openExternal(args.map);
    });

    ipcMain.on("is-suspend", (event, args) => {
        event.returnValue = isSuspend;
    });
    // 登录成功
    ipcMain.on("logined", (event, args) => {
        closeWindowToExit = args.closeWindowToExit;
        try {
            mainWindow.resizable = true;
            mainWindow.maximizable = true;
            mainWindow.minimizable = true;
            mainWindow.setMinimumSize(900, 600);
            mainWindow.setSize(mainWindowState.width, mainWindowState.height);
            mainWindow.center();
            mainWindowState.manage(mainWindow);
        } catch (error) {
            console.log(error);
        }
    });
    // 退出登录
    ipcMain.on("logouted", (event, args) => {
        try {
            mainWindowState.unmanage();
            mainWindow.resizable = false;
            mainWindow.maximizable = false;
            mainWindow.setMinimumSize(300, 420);
            mainWindow.setSize(300, 420);
            mainWindow.center();

            // 消息数量置空
            updateTray(0);
            app.badgeCount = 0;
            // 清缓存 被挤掉不清除缓存
            if (args !== -7) {
                session.defaultSession.clearCache();
                session.defaultSession.clearAuthCache();
                session.defaultSession.clearStorageData();
            }

            // 退出账号的时候需要关闭除主窗口之外的其他所有窗口
            let allWindows = BrowserWindow.getAllWindows();
            if (allWindows && allWindows.length > 1) {
                allWindows.forEach((w) => {
                    if (
                        w.webContents.getURL() !== mainWindow &&
                        mainWindow.webContents.getURL()
                    ) {
                        w.close();
                    }
                });
            }
        } catch (error) {
            console.log(error);
        }
    });

    // 注销操作
    ipcMain.on("account-cancellation", (event, args) => {
        mainWindow && mainWindow.webContents.send("account-cancellation", args);
    });
    // 会员信息变更操作
    ipcMain.on("vip-change-permission", (event, args) => {
        mainWindow && mainWindow.webContents.send("vip-change-permission");
    });
    // 快速会议呼起邀请处理
    ipcMain.on(IPCEventType.Quick_Meeting_Ring, (event, args) => {
        // 过滤所有窗口中是否有会议，音视频等窗口，
        let allWindows = BrowserWindow.getAllWindows();
        let index = allWindows.findIndex((w) => {
            return w.webContents.getURL().indexOf("voip") > -1;
        });
        if (!quickMeetingWindow && index === -1) {
            quickMeetingWindow = createWindow(
                args.url,
                360,
                640,
                360,
                640,
                true,
                true
            );
            // debug
            if (pkg.appDebug) {
                quickMeetingWindow.webContents.openDevTools();
            }
            quickMeetingWindow.on("close", () => {
                quickMeetingWindow = null;
            });
            quickMeetingWindow.webContents.on("did-finish-load", (e) => {
                try {
                    quickMeetingWindow.webContents.send(
                        IPCEventType.Quick_Meeting_Ring_Response,
                        args.msg
                    );
                    quickMeetingWindow.show();
                    quickMeetingWindow.focus();
                } catch (error) {
                    console.log(error);
                }
            });
        }
    });
    // 点击加入会议
    ipcMain.on(IPCEventType.Send_Join_Conference, (event, args) => {
        mainWindow &&
            mainWindow.webContents.send(
                IPCEventType.Send_Join_Conference,
                args
            );
    });
    // 进入会议后回调
    ipcMain.on("join-conference-result", () => {
        quickMeetingWindow &&
            quickMeetingWindow.webContents.send("join-conference-result");
    });

    ipcMain.on(IPCEventType.Close_Meeting_Ring, () => {
        quickMeetingWindow && quickMeetingWindow.close();
        quickMeetingWindow = null;
    });

    ipcMain.on("enable-close-window-to-exit", (event, enable) => {
        closeWindowToExit = enable;
    });
    //是否在登录页
    ipcMain.on("login-page", (event, args) => {
        isLoginPage = args.isLogin;
    });

    ipcMain.on("start-op-server", (event, args) => {
        startOpenPlatformServer(args.port);
    });
    // 通知消息进入聊天
    ipcMain.on("send-check-friend", (event, args) => {
        mainWindow && mainWindow.webContents.send("send-check-friend", args);
    });
    ipcMain.on("restart-setLanguage", () => {
        app.relaunch();
        app.exit(0);
    });
    ipcMain.handle("getMediaSourceId", (event, args) => {
        const senderWindow = BrowserWindow.fromWebContents(event.sender); // BrowserWindow or null
        return senderWindow.getMediaSourceId();
    });
    powerMonitor.on("resume", () => {
        isSuspend = false;
        mainWindow && mainWindow.webContents.send("os-resume");
        proto.onAppResume();
    });

    powerMonitor.on("suspend", () => {
        isSuspend = true;
        proto.onAppSuspend();
    });

    if (isOsx) {
        app.setAboutPanelOptions({
            applicationName: pkg.productName,
            applicationVersion: pkg.version,
            copyright: pkg.company,
            version: pkg.version,
        });
    }

    [
        imagesCacheDir,
        voicesCacheDir,
        downloadCacheDir,
        downloadCloudCacheDir,
    ].map((e) => {
        if (!fs.existsSync(e)) {
            fs.mkdirSync(e);
        }
    });

    mainWindow.webContents.setUserAgent(
        `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.8 ChainMeet/${pkg.version} ChainPalForPC appVersion=${pkg.version}`
    );
    createMenu();
};

// TODO titleBarStyle
function createWindow(
    url,
    w,
    h,
    mw,
    mh,
    resizable = true,
    maximizable = true,
    showTitle = true,
    webSecurity = false
) {
    let win = new BrowserWindow({
        width: w,
        height: h,
        minWidth: mw,
        minHeight: mh,
        resizable: resizable,
        maximizable: maximizable,
        minimizable: true,
        titleBarStyle: showTitle ? "default" : "hiddenInset",
        webPreferences: {
            scrollBounce: false,
            nativeWindowOpen: true,
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true,
            webSecurity: webSecurity,
        },
        // frame: false,
        icon,
        show: false,
    });
    win.removeMenu();

    win.loadURL(url);
    console.log("create windows url", url);
    require("@electron/remote/main").enable(win.webContents);
    win.webContents.on("new-window", (event, url) => {
        event.preventDefault();
        console.log("new-windows", url);
        shell.openExternal(url);
    });
    return win;
}

// deep link
const PROTOCOL = "chainpalpc";

function onDeepLink(url) {
    let linkName = "";
    for (const key in deepLinkData) {
        if (url.indexOf(key) > -1) {
            linkName = deepLinkData[key];
        }
    }
    console.log("onOpenDeepLink", url, linkName);
    if (linkName) {
        mainWindow.webContents.send(linkName, url);
        // mainWindow.webContents.send("deep-link", url);
    } else {
        mainWindow.focus();
        mainWindow.show();
    }
}

app.setAsDefaultProtocolClient(PROTOCOL);
// pls refer to: https://blog.csdn.net/youyudexiaowangzi/article/details/118676790
// windows 7 下面，如果启动黑屏，请将下面注释打开
//app.disableHardwareAcceleration();
app.on("open-url", (event, url) => {
    // log.warn("open-url----------------", url);
    let timer = setTimeout(() => {
        onDeepLink(url);
        timer && clearTimeout(timer);
    });
});

app.setName(pkg.productName);

// mac 图标有透明边框，
const icon = isWin
    ? `${workingDir}/images/icon.png`
    : `${workingDir}/images/dock.png`;

isDevelopment && app.dock && app.dock.setIcon(icon);

if (!app.requestSingleInstanceLock()) {
    console.log("only allow start one instance!");
    app.quit();
}

app.on("second-instance", (event, argv) => {
    // log.warn("second-instance----------------", argv);
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
        mainWindow.show();
    }
    let url = argv.find((arg) => arg.startsWith(PROTOCOL));
    // log.warn("获取url----------------", url);
    if (url) {
        onDeepLink(url);
    }
});

// windows上，需要正确设置appUserModelId，才能正常显示通知，不然通知的应用标识会显示为：electron.app.xxx
app.on("will-finish-launching", () => {
    /**
     * (cn.wildfire.chat)这是野火的 appid  需要更改为chainpal 的 appid（未定义 例如：com.tongfudun.chainpal.pc，）
     * 目前未更改是因为更改后无法覆盖更新以前的包，需要有1版强制更新或者其他可以更改的时机去变更
     */
    app.setAppUserModelId(pkg.appId);
});

function registerLocalResourceProtocol() {
    protocol.registerFileProtocol("local-resource", (request, callback) => {
        const url = request.url.replace(/^local-resource:\/\//, "");
        // Decode URL to prevent errors when loading filenames with UTF-8 chars or chars like "#"
        const decodedUrl = decodeURI(url); // Needed in case URL contains spaces
        try {
            return callback(decodedUrl);
        } catch (error) {
            console.error(
                "ERROR: registerLocalResourceProtocol: Could not get file path:",
                error
            );
        }
    });

    protocol.registerFileProtocol("file", (request, callback) => {
        const pathname = decodeURIComponent(
            request.url.replace("file:///", "")
        );
        callback(pathname);
    });
}

app.on("ready", () => {
    // 这里不生效暂未找到解决办法
    try {
        let lang = app.getLocale().indexOf("en") > -1 ? "en" : "ch";
        Locales.setLocale(lang);
    } catch (error) {}

    initProtoMain(proto);

    createMainWindow();

    regShortcut();

    registerLocalResourceProtocol();
    // if (!app.isMas) {
    // 配置和启用electron - updater更新功能
    handleUpdate();
    // }

    screenshots = new Screenshots({
        // logger: console.log
        singleWindow: true,
    });

    const onScreenShotEnd = (result) => {
        if (isMainWindowFocusedWhenStartScreenshot) {
            if (result) {
                mainWindow.webContents.send("screenshots-ok", result);
            }
            mainWindow.show();
            isMainWindowFocusedWhenStartScreenshot = false;
        } else if (screenShotWindowId) {
            let windows = BrowserWindow.getAllWindows();
            let tms = windows.filter(
                (win) => win.webContents.id === screenShotWindowId
            );
            if (tms.length > 0) {
                if (result) {
                    tms[0].webContents.send("screenshots-ok", result);
                }
                tms[0].show();
            }
            screenShotWindowId = 0;
        }
    };

    // 点击确定按钮回调事件
    screenshots.on("ok", (e, buffer, bounds) => {
        let filename = tmp.tmpNameSync() + ".png";
        let image = NativeImage.createFromBuffer(buffer);
        fs.writeFileSync(filename, image.toPNG());
        console.log("screenshots ok", e);
        onScreenShotEnd({ filePath: filename });
    });

    // 点击取消按钮回调事件
    screenshots.on("cancel", (e) => {
        // 执行了preventDefault
        // 点击取消不会关闭截图窗口
        // e.preventDefault()
        console.log("screenshots cancel", e);
        onScreenShotEnd();
    });
    // 点击保存按钮回调事件
    screenshots.on("save", (e, { viewer }) => {
        console.log("screenshots save", e);
        onScreenShotEnd();
    });
    session.defaultSession.webRequest.onBeforeSendHeaders(
        (details, callback) => {
            // 可根据实际需求，配置 Origin，默认置为空
            // details.requestHeaders.Origin = '';
            callback({ cancel: false, requestHeaders: details.requestHeaders });
        }
    );
    try {
        updateTray();
    } catch (e) {
        // do nothing
    }

    ipcMain.on("change-myWeb3-proxy", (event, args) => {
        session
            .fromPartition("persist:webviewsession")
            .setProxy({ proxyRules: proxyUrl }, function () {
                console.log(proxyUrl + "设置了代理");
            });
    });
    // 跨域专网
    ipcMain.on("change-proxy", (event, args) => {
        // console.log(args);
        let { proxyPassword, proxyUrl, proxyUsername, isProxy } = args;
        // 开启了代理
        if (isProxy) {
            console.log("开启代理");
            // 针对 webview 进行设置跨域代理
            session
                .fromPartition("persist:webviewsession")
                .setProxy({ proxyRules: proxyUrl }, function () {
                    console.log(proxyUrl + "设置了代理");
                });
            // 进行代理账号密码授权
            app.on(
                "login",
                (event, webContents, details, authInfo, callback) => {
                    event.preventDefault();
                    console.log("代理成功了", authInfo);
                    callback(proxyUsername, proxyPassword);
                    // callback("chainmeet", "LbP6PrQMblbTTq1c"); // 默认账号密码
                }
            );
        } else {
            console.log("关闭代理");
            session
                .fromPartition("persist:webviewsession")
                .setProxy({ proxyRules: "direct://" }, function () {
                    console.log("代理关闭了");
                });
        }
    });
});

// 登录页面，获取当前设置的语言，进行设置，测试未生效~~ TODO
ipcMain.on("currentLocale", (event, args) => {
    let lang = args.indexOf("en") > -1 ? "en" : "ch";
    i18n.setLocale(lang);
});

// app.on('window-all-closed', () => {
//     if (process.platform !== 'darwin') {
//         app.quit()
//     }
// })

app.on("before-quit", () => {
    // Fix issues #14
    forceQuit = true;

    if (!tray) return;
    // if (!isOsx) {
    tray.destroy();
    tray = null;
    // }
});
app.on("activate", (e) => {
    if (mainWindow && !mainWindow.isVisible()) {
        mainWindow.show();
    }
});

function disconnectAndQuit() {
    proto.setConnectionStatusListener(() => {
        // 仅仅是为了让渲染进程不收到 ConnectionStatusLogout
        // do nothing
    });
    proto.disconnect(0);
    setTimeout(() => {
        app.quit();
    }, 1000);
}

function clearBlink() {
    if (blink) {
        clearInterval(blink);
    }
    blink = null;
}

let blinkIcons;

function execBlink(flag, _interval) {
    let interval = _interval ? _interval : 500;
    if (!blinkIcons) {
        blinkIcons = [
            NativeImage.createFromPath(`${workingDir}/images/tray.png`),
            NativeImage.createFromPath(`${workingDir}/images/Remind_icon.png`),
        ];
    }

    let count = 0;
    if (flag) {
        if (blink) {
            return;
        }
        blink = setInterval(function () {
            toggleTrayIcon(blinkIcons[count++]);
            count = count > 1 ? 0 : 1;
        }, interval);
    } else {
        clearBlink();
        toggleTrayIcon(blinkIcons[0]);
    }
}

function toggleTrayIcon(icon) {
    if (tray) {
        tray.setImage(icon);
    }
}

var openPlatformServer;

function startOpenPlatformServer(port) {
    if (openPlatformServer) {
        return;
    }
    const WebSocket = require("ws");
    const wss = new WebSocket.Server({ port: port });

    wss.on("connection", (ws) => {
        ws.on("message", (data) => {
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            });
        });
    });

    openPlatformServer = wss;
}
