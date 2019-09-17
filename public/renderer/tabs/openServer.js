"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const electron = require("electron");
const fetch_1 = require("../../shared/fetch");
const i18n = require("../../shared/i18n");
const index_1 = require("./index");
const { ValjangEngine: { appApiVersion: appApiVersion } } = JSON.parse(fs.readFileSync(`${__dirname}/../../package.json`, { encoding: "utf8" }));
function openServer(serverEntry) {
    index_1.clearActiveTab();
    let tabElt = index_1.tabStrip.tabsRoot.querySelector(`li[data-server-id="${serverEntry.id}"]`);
    let paneElt = index_1.panesElt.querySelector(`div[data-server-id="${serverEntry.id}"]`);
    if (tabElt == null) {
        tabElt = makeServerTab(serverEntry);
        index_1.tabStrip.tabsRoot.appendChild(tabElt);
        paneElt = makeServerPane(serverEntry);
        index_1.panesElt.appendChild(paneElt);
    }
    tabElt.classList.add("active");
    paneElt.hidden = false;
}
exports.default = openServer;
function makeServerTab(serverEntry) {
    const tabElt = document.createElement("li");
    tabElt.dataset["serverId"] = serverEntry.id;
    const iconElt = document.createElement("img");
    iconElt.className = "icon";
    iconElt.src = "images/tabs/server.svg";
    tabElt.appendChild(iconElt);
    const labelElt = document.createElement("div");
    labelElt.className = "label";
    tabElt.appendChild(labelElt);
    const locationElt = document.createElement("div");
    locationElt.className = "location";
    locationElt.textContent = serverEntry.hostname + (serverEntry.port != null ? `:${serverEntry.port}` : "");
    labelElt.appendChild(locationElt);
    const nameElt = document.createElement("div");
    nameElt.className = "name";
    nameElt.textContent = serverEntry.label;
    labelElt.appendChild(nameElt);
    const closeButton = document.createElement("button");
    closeButton.className = "close";
    tabElt.appendChild(closeButton);
    return tabElt;
}
function makeServerPane(serverEntry) {
    const paneElt = document.createElement("div");
    paneElt.dataset["serverId"] = serverEntry.id;
    const connectingElt = document.createElement("div");
    connectingElt.className = "connecting";
    paneElt.appendChild(connectingElt);
    const statusElt = document.createElement("div");
    connectingElt.appendChild(statusElt);
    const retryButton = document.createElement("button");
    retryButton.textContent = i18n.t("common:server.tryAgain");
    connectingElt.appendChild(retryButton);
    function onRetryButtonClick(event) {
        event.preventDefault();
        tryConnecting();
    }
    retryButton.addEventListener("click", onRetryButtonClick);
    // Automatically add insecure protocol if none is already provided in the hostname
    const protocol = serverEntry.hostname.startsWith("https://") ? "https://" : "http://";
    let hostname = serverEntry.hostname;
    if (hostname.startsWith("http://"))
        hostname = hostname.substring("http://".length);
    else if (hostname.startsWith("https://"))
        hostname = hostname.substring("https://".length);
    if (hostname.endsWith("/"))
        hostname = hostname.substring(0, hostname.length - 1);
    const hostnameAndPort = `${hostname}:${serverEntry.port}`;
    const baseUrl = protocol + hostnameAndPort;
    function tryConnecting() {
        statusElt.textContent = i18n.t("common:server.connecting", { baseUrl });
        retryButton.hidden = true;
        let httpAuth = null;
        if (serverEntry.password.length > 0) {
            httpAuth = { username: "ValjangEngine", password: serverEntry.password };
        }
        fetch_1.default(`${baseUrl}/ValjangEngine.json`, { type: "json", httpAuth }, onFetchJSON);
    }
    function onFetchJSON(err, serverInfo) {
        if (err != null) {
            if (err.status === 401)
                statusElt.textContent = i18n.t("common:server.errors.incorrectPassword", { baseUrl });
            else
                statusElt.textContent = i18n.t("common:server.errors.ValjangEngineJSON", { baseUrl });
            retryButton.hidden = false;
            return;
        }
        if (serverInfo == null || typeof serverInfo !== "object") {
            statusElt.textContent = i18n.t("common:server.errors.notValjangEngine", { baseUrl });
            retryButton.hidden = false;
            return;
        }
        if (serverInfo.appApiVersion !== appApiVersion) {
            statusElt.textContent = i18n.t("common:server.errors.incompatibleVersion", { baseUrl, serverVersion: serverInfo.appApiVersion, appVersion: appApiVersion });
            retryButton.hidden = false;
            return;
        }
        const webviewElt = document.createElement("webview");
        webviewElt.preload = `${__dirname}/../../SupApp/index.js`;
        function clearEventListeners() {
            webviewElt.removeEventListener("did-finish-load", onLoad);
            webviewElt.removeEventListener("did-fail-load", onError);
        }
        function onLoad() {
            clearEventListeners();
            paneElt.removeChild(connectingElt);
        }
        function onError() {
            clearEventListeners();
            paneElt.removeChild(webviewElt);
            statusElt.textContent = "Failed to load webview";
        }
        webviewElt.addEventListener("did-finish-load", onLoad);
        webviewElt.addEventListener("did-fail-load", onError);
        webviewElt.src = baseUrl;
        paneElt.appendChild(webviewElt);
        webviewElt.focus();
        const buildHostnameAndPort = `${hostname}:${serverInfo.buildPort}`;
        const auth = { username: "ValjangEngine", password: serverEntry.password };
        electron.ipcRenderer.send("set-http-auth", hostnameAndPort, auth);
        electron.ipcRenderer.send("set-http-auth", buildHostnameAndPort, auth);
    }
    tryConnecting();
    return paneElt;
}
