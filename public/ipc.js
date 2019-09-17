"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const fs = require("fs");
const path = require("path");
let authorizationsByOrigin = {};
function loadAuthorizations(dataPath) {
    try {
        const authorizationsByOriginJSON = fs.readFileSync(`${dataPath}/authorizationsByOrigin.json`, { encoding: "utf8" });
        authorizationsByOrigin = JSON.parse(authorizationsByOriginJSON);
        if (authorizationsByOrigin == null || typeof authorizationsByOrigin !== "object")
            authorizationsByOrigin = {};
    }
    catch (err) {
        // Ignore
    }
}
exports.loadAuthorizations = loadAuthorizations;
function saveAuthorizations(dataPath) {
    fs.writeFileSync(`${dataPath}/authorizationsByOrigin.json`, JSON.stringify(authorizationsByOrigin, null, 2));
}
exports.saveAuthorizations = saveAuthorizations;
function getAuthorizationsForOrigin(origin) {
    let authorizations = authorizationsByOrigin[origin];
    if (authorizations == null)
        authorizations = authorizationsByOrigin[origin] = { folders: [], rwFiles: [], exeFiles: [] };
    return authorizations;
}
electron.ipcMain.on("setup-key", onSetupKey);
electron.ipcMain.on("choose-folder", onChooseFolder);
electron.ipcMain.on("choose-file", onChooseFile);
electron.ipcMain.on("authorize-folder", onAuthorizeFolder);
electron.ipcMain.on("check-path-authorization", onCheckPathAuthorization);
electron.ipcMain.on("send-message", onSendMessage);
const secretKeys = new Map();
function onSetupKey(event, secretKey) {
    let keys = secretKeys.get(event.sender);
    if (keys == null) {
        keys = [];
        secretKeys.set(event.sender, keys);
    }
    keys.push(secretKey);
}
function onChooseFolder(event, secretKey, ipcId, origin) {
    if (!secretKeys.get(event.sender).includes(secretKey))
        return;
    electron.dialog.showOpenDialog({ properties: ["openDirectory"] }, (directory) => {
        if (directory == null) {
            event.sender.send("choose-folder-callback", ipcId, null);
            return;
        }
        const normalizedPath = path.normalize(directory[0]);
        getAuthorizationsForOrigin(origin).folders.push(normalizedPath);
        event.sender.send("choose-folder-callback", ipcId, normalizedPath);
    });
}
function onChooseFile(event, secretKey, ipcId, origin, access) {
    if (!secretKeys.get(event.sender).includes(secretKey))
        return;
    electron.dialog.showOpenDialog({ properties: ["openFile"] }, (file) => {
        if (file == null) {
            event.sender.send("choose-file-callback", ipcId, null);
            return;
        }
        const normalizedPath = path.normalize(file[0]);
        const auths = getAuthorizationsForOrigin(origin);
        if (access === "execute")
            auths.exeFiles.push(normalizedPath);
        else
            auths.rwFiles.push(normalizedPath);
        event.sender.send("choose-file-callback", ipcId, normalizedPath);
    });
}
function onAuthorizeFolder(event, secretKey, ipcId, origin, folderPath) {
    const normalizedPath = path.normalize(folderPath);
    getAuthorizationsForOrigin(origin).folders.push(normalizedPath);
    event.sender.send("authorize-folder-callback", ipcId);
}
function onCheckPathAuthorization(event, secretKey, ipcId, origin, pathToCheck) {
    if (!secretKeys.get(event.sender).includes(secretKey))
        return;
    const normalizedPath = path.normalize(pathToCheck);
    const authorizations = getAuthorizationsForOrigin(origin);
    let canReadWrite = authorizations.rwFiles.indexOf(normalizedPath) !== -1;
    let canExecute = authorizations.exeFiles.indexOf(normalizedPath) !== -1;
    if (!canReadWrite) {
        for (const authorizedFolderPath of authorizations.folders) {
            if (normalizedPath.indexOf(authorizedFolderPath + path.sep) === 0) {
                canReadWrite = true;
                break;
            }
        }
    }
    const authorization = canReadWrite ? "readWrite" : (canExecute ? "execute" : null);
    event.sender.send("check-path-authorization-callback", ipcId, normalizedPath, authorization);
}
function onSendMessage(event, windowId, message, args = []) {
    const window = electron.BrowserWindow.fromId(windowId);
    if (window == null)
        return;
    window.webContents.send(`sup-app-message-${message}`, ...args);
}
