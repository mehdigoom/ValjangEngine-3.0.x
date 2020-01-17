"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const i18n = require("./shared/i18n");
const menu = require("./menu");
const getPaths_1 = require("./getPaths");
const getLanguageCode_1 = require("./getLanguageCode");
const SupAppIPC = require("./ipc");
const url = require("url");

const client = require('discord-rich-presence')('561598172548300820');
 
client.updatePresence({
  state: 'Je créer un jeu vidéo ! / I create a video game !',
  details: '>>>http://valjang.fr<<<',
  startTimestamp: Date.now(),
  endTimestamp: Date.now() + 1337,
  largeImageKey: 'snek_large',
  smallImageKey: 'snek_small',
  instance: true,
});




let corePath;
let userDataPath;
let mainWindow;
let trayIcon;
let trayMenu;
electron.app.requestSingleInstanceLock();
electron.app.on("second-instance", (event, argv, cwd) => electron.app.exit(0));
electron.app.on("ready", onAppReady);
electron.app.on("activate", () => { restoreMainWindow(); });
let isQuitting = false;
let isReadyToQuit = false;
electron.app.on("before-quit", (event) => {
    if (!isQuitting) {
        event.preventDefault();
        startCleanExit();
        return;
    }
    if (!isReadyToQuit)
        event.preventDefault();
});
function startCleanExit() {
    console.log("Exiting cleanly...");
    if (mainWindow != null)
        mainWindow.webContents.send("quit");
    isQuitting = true;
}
electron.ipcMain.on("ready-to-quit", (event) => {
    if (event.sender !== mainWindow.webContents)
        return;
    SupAppIPC.saveAuthorizations(userDataPath);
    console.log("Exited cleanly.");
    isReadyToQuit = true;
    electron.app.quit();
});
electron.ipcMain.on("show-main-window", () => { restoreMainWindow(); });
function onAppReady() {
    menu.setup(electron.app);
    getPaths_1.default((dataPathErr, pathToCore, pathToUserData) => {
        userDataPath = pathToUserData;
        corePath = pathToCore;
        SupAppIPC.loadAuthorizations(userDataPath);
        getLanguageCode_1.default(userDataPath, (languageCode) => {
            i18n.setLanguageCode(languageCode);
            i18n.load(["startup", "tray"], () => {
                if (dataPathErr != null) {
                    electron.dialog.showErrorBox(i18n.t("startup:failedToStart"), i18n.t(dataPathErr.key, dataPathErr.variables));
                    electron.app.quit();
                    process.exit(1);
                    return;
                }
                setupTrayOrDock();
                setupMainWindow();
                // NOTE: Disabled for now, see below
                // process.on("SIGINT", onSigInt);
            });
        });
    });
}
// NOTE: Electron v0.37.7 doesn't really support
// attaching a SIGINT handler (at least on Windows).
// The process will be killed while the handler is still running.
// See https://github.com/electron/electron/issues/5273
/*
let sigIntCount = 0;
function onSigInt() {
  sigIntCount++;
  if (sigIntCount === 3) {
    console.log("Forcing abrupt exit.");
    process.exit(0);
  }

  if (isQuitting) return;
  startCleanExit();
}
*/
function setupTrayOrDock() {
    trayMenu = electron.Menu.buildFromTemplate([
        { label: i18n.t("tray:dashboard"), type: "normal", click: () => { restoreMainWindow(); } },
        { type: "separator" },
        { label: i18n.t("tray:exit"), type: "normal", click: () => { electron.app.quit(); } }
    ]);
    // TODO: Insert 5 most recently used servers
    // trayMenu.insert(0, new electron.MenuItem({ type: "separator" }));
    // trayMenu.insert(0, new electron.MenuItem({ label: "My Server", type: "normal", click: () => {} }));
    if (process.platform !== "darwin") {
        trayIcon = new electron.Tray(`${__dirname}/icon-16.png`);
        trayIcon.setToolTip("ValjangEngine");
        trayIcon.setContextMenu(trayMenu);
        trayIcon.on("double-click", () => { restoreMainWindow(); });
    }
    else {
        electron.app.dock.setMenu(trayMenu);
    }
}
function setupMainWindow() {
    mainWindow = new electron.BrowserWindow({
        width: 1000, height: 600, icon: `${__dirname}/ValjangEngine.ico`,
        minWidth: 800, minHeight: 480,
        useContentSize: true, autoHideMenuBar: true,
        show: false
    });
    mainWindow.loadURL(`file://${__dirname}/renderer/${i18n.getLocalizedFilename("index.html")}`);
    mainWindow.webContents.on("did-finish-load", () => {
        mainWindow.webContents.send("init", corePath, userDataPath, i18n.languageCode);
        mainWindow.show();
    });
    mainWindow.webContents.on("will-navigate", (event, newURL) => {
        event.preventDefault();
        electron.shell.openExternal(newURL);
    });
    mainWindow.on("close", onCloseMainWindow);
}
function onCloseMainWindow(event) {
    if (isQuitting)
        return;
    event.preventDefault();
    if (process.platform !== "darwin") {
        // NOTE: Minimize before closing to convey the fact
        // that the app is still running in the background
        mainWindow.minimize();
        setTimeout(() => { if (mainWindow.isMinimized())
            mainWindow.hide(); }, 200);
    }
    else {
        mainWindow.hide();
    }
    if (process.platform === "win32") {
        trayIcon.displayBalloon({
            title: i18n.t("tray:stillRunning.title"),
            content: i18n.t("tray:stillRunning.content")
        });
    }
}
function restoreMainWindow() {
    if (isQuitting)
        return;
    if (mainWindow == null)
        return true;
    if (!mainWindow.isVisible())
        mainWindow.show();
    if (mainWindow.isMinimized())
        mainWindow.restore();
    mainWindow.focus();
    return true;
}
// Handle HTTP basic auth
const httpAuthByHosts = {};
electron.ipcMain.on("set-http-auth", (event, host, auth) => {
    httpAuthByHosts[host] = auth;
});
electron.app.on("login", (event, webContents, request, authInfo, callback) => {
    event.preventDefault();
    const parsedUrl = url.parse(request.url);
    const port = parsedUrl.port != null ? parsedUrl.port : (parsedUrl.protocol === "https:" ? 443 : 80);
    const hostnameAndPort = `${parsedUrl.hostname}:${port}`;
    const auth = httpAuthByHosts[hostnameAndPort];
    if (auth == null) {
        // Since this might race with the set-http-auth event above,
        // try again a second later
        setTimeout(() => {
            const auth = httpAuthByHosts[hostnameAndPort];
            if (auth == null)
                callback(null, null);
            else
                callback(auth.username, auth.password);
        }, 1000);
        return;
    }
    callback(auth.username, auth.password);
});
