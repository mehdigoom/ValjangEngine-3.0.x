"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./me");
const ResizeHandle = require("resize-handle");
const TreeView = require("dnd-tree-view");
const simple_dialogs_1 = require("simple-dialogs");
const i18n = require("../../shared/i18n");
const AddOrEditServerDialog_1 = require("./AddOrEditServerDialog");
const settings = require("../settings");
const serverSettings = require("../serverSettings");
const openServer_1 = require("../tabs/openServer");
new ResizeHandle(document.querySelector("body > .sidebar"), "left");
const addServerBtn = document.querySelector(".add-server");
const editServerBtn = document.querySelector(".edit-server");
const removeServerBtn = document.querySelector(".remove-server");
const serversTreeView = new TreeView(document.querySelector(".servers-tree-view"), { dropCallback: onServerDrop });

function start() {
    addServer({
        id: "public",
        label: "Public server",
        hostname: "Valjang Engine public server.",
        port: null,
        password: null
    });
    addServer({
        id: "local",
        label: "local",
        hostname: "localhost",
        port: 4200,
        password: null
    });
    for (const serverEntry of settings.favoriteServers)
        addServer(serverEntry);
    addServerBtn.disabled = false;
}
exports.start = start;
addServerBtn.addEventListener("click", onAddServerClick);
editServerBtn.addEventListener("click", onEditServerClick);
removeServerBtn.addEventListener("click", onRemoveServerClick);
serversTreeView.on("selectionChange", updateSelectedServer);
serversTreeView.on("activate", onServerActivate);

function onAddServerClick(event) {
    const addOrEditOptions = {
        validationLabel: "Add",
        initialHostnameValue: "",
        initialPortValue: "4237",
        initialLabelValue: "",
        initialPasswordValue: ""
    };
    new AddOrEditServerDialog_1.default(i18n.t("sidebar:addServer.title"), addOrEditOptions, (newServer) => {
        if (newServer == null)
            return;
        let id = 0;
        for (const server of settings.favoriteServers)
            id = Math.max(id, parseInt(server.id, 10) + 1);
        newServer.id = id.toString();
        addServer(newServer);
        settings.favoriteServers.push(newServer);
        settings.favoriteServersById[newServer.id] = newServer;
        settings.scheduleSave();
    });
}

function onEditServerClick(event) {
    const serverId = serversTreeView.selectedNodes[0].dataset["serverId"];
    if (serverId === "local")
        return;
    const serverEntry = settings.favoriteServersById[serverId];
    const addOrEditOptions = {
        validationLabel: i18n.t("common:actions.save"),
        initialHostnameValue: serverEntry.hostname,
        initialPortValue: serverEntry.port,
        initialLabelValue: serverEntry.label,
        initialPasswordValue: serverEntry.password
    };
    new AddOrEditServerDialog_1.default(i18n.t("sidebar:editServer.title"), addOrEditOptions, (updatedEntry) => {
        if (updatedEntry == null)
            return;
        serverEntry.hostname = updatedEntry.hostname;
        serverEntry.port = updatedEntry.port;
        serverEntry.label = updatedEntry.label;
        serverEntry.password = updatedEntry.password;
        const selectedServerElt = serversTreeView.treeRoot.querySelector(`li[data-server-id="${serverId}"]`);
        const host = serverEntry.hostname + (serverEntry.port != null ? `:${serverEntry.port}` : "");
        selectedServerElt.querySelector(".host").textContent = host;
        selectedServerElt.querySelector(".label").textContent = serverEntry.label;
        settings.scheduleSave();
    });
}

function onRemoveServerClick(event) {
    const selectedServerId = serversTreeView.selectedNodes[0].dataset["serverId"];
    if (selectedServerId === "local")
        return;
    new simple_dialogs_1.ConfirmDialog("Are you sure you want to remove the server?", { validationLabel: "Remove" }, (confirm) => {
        if (!confirm)
            return;
        const selectedServerElt = serversTreeView.treeRoot.querySelector(`li[data-server-id="${selectedServerId}"]`);
        serversTreeView.treeRoot.removeChild(selectedServerElt);
        const favoriteServer = settings.favoriteServersById[selectedServerId];
        delete settings.favoriteServersById[selectedServerId];
        settings.favoriteServers.splice(settings.favoriteServers.indexOf(favoriteServer), 1);
        settings.scheduleSave();
    });
}

function addServer(serverEntry) {
    const serverElt = document.createElement("li");
    serverElt.dataset["serverId"] = serverEntry.id;
    serversTreeView.append(serverElt, "item");
    const labelElt = document.createElement("div");
    labelElt.classList.add("label");
    labelElt.textContent = serverEntry.label;
    serverElt.appendChild(labelElt);
    const hostElt = document.createElement("div");
    hostElt.classList.add("host");
    const host = serverEntry.hostname + (serverEntry.port != null ? `:${serverEntry.port}` : "");
    hostElt.textContent = host;
    serverElt.appendChild(hostElt);
}

function onServerDrop(event, dropLocation, orderedNodes) {
    // TODO
    return false;
}

function updateSelectedServer() {
    let canEditSelectedServer = false;
    if (serversTreeView.selectedNodes.length !== 0) {
        const selectedServerId = serversTreeView.selectedNodes[0].dataset["serverId"];
        canEditSelectedServer = selectedServerId !== "local";
    }
    editServerBtn.disabled = !canEditSelectedServer;
    removeServerBtn.disabled = !canEditSelectedServer;
}

function onServerActivate() {
    if (serversTreeView.selectedNodes.length === 0)
        return;
    const serverId = serversTreeView.selectedNodes[0].dataset["serverId"];
    let serverEntry;
    if (serverId === "local") {
        // Fetch local server config to build up-to-date entry
        serverEntry = {
            id: "local",
            label: i18n.t("server:myServer"),
            hostname: "localhost",
            port: serverSettings.config.mainPort.toString(),
            password: serverSettings.config.password
        };
    } else {
        serverEntry = settings.favoriteServersById[serverId];
    }


    if (serverId === "public") {

        serverEntry = {
            id: "public",
            label: "Public",
            hostname: "public.valjang.fr",
            port: 4200,
            password: serverSettings.config.password
        };
    } else {
        serverEntry = settings.favoriteServersById[serverId];
    }
    openServer_1.default(serverEntry);
}