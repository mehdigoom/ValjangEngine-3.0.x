"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
function setup(app) {
    if (process.platform !== "darwin") {
        electron_1.Menu.setApplicationMenu(null);
        return;
    }
    const name = app.getName();
    const template = [
        {
            label: name,
            submenu: [
                {
                    label: "About " + name,
                    role: "about"
                },
                {
                    type: "separator"
                },
                {
                    label: "Services",
                    role: "services",
                    submenu: []
                },
                {
                    type: "separator"
                },
                {
                    label: "Hide " + name,
                    accelerator: "Command+H",
                    role: "hide"
                },
                {
                    label: "Hide Others",
                    accelerator: "Command+Alt+H",
                    role: "hideothers"
                },
                {
                    label: "Show All",
                    role: "unhide"
                },
                {
                    type: "separator"
                },
                {
                    label: "Quit",
                    accelerator: "Command+Q",
                    click() { app.quit(); }
                },
            ]
        },
        {
            label: "Edit",
            submenu: [
                {
                    label: "Undo",
                    accelerator: "CmdOrCtrl+Z",
                    role: "undo"
                },
                {
                    label: "Redo",
                    accelerator: "Shift+CmdOrCtrl+Z",
                    role: "redo"
                },
                {
                    type: "separator"
                },
                {
                    label: "Cut",
                    accelerator: "CmdOrCtrl+X",
                    role: "cut"
                },
                {
                    label: "Copy",
                    accelerator: "CmdOrCtrl+C",
                    role: "copy"
                },
                {
                    label: "Paste",
                    accelerator: "CmdOrCtrl+V",
                    role: "paste"
                },
                {
                    label: "Select All",
                    accelerator: "CmdOrCtrl+A",
                    role: "selectall"
                },
            ]
        },
        {
            label: "Window",
            role: "window",
            submenu: [
                {
                    label: "Minimize",
                    accelerator: "CmdOrCtrl+M",
                    role: "minimize"
                },
                {
                    label: "Close",
                    accelerator: "CmdOrCtrl+W",
                    role: "close"
                },
                {
                    type: "separator"
                },
                {
                    label: "Bring All to Front",
                    role: "front"
                }
            ]
        },
    ];
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
}
exports.setup = setup;
