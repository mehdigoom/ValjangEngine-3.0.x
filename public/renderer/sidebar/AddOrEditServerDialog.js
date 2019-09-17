"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const simple_dialogs_1 = require("simple-dialogs");
const i18n = require("../../shared/i18n");
class AddOrEditServerDialog extends simple_dialogs_1.BaseDialog {
    constructor(headerLabel, options, callback) {
        super(callback);
        // Header
        const headerElt = document.createElement("header");
        headerElt.textContent = headerLabel;
        this.formElt.appendChild(headerElt);
        // Hostname and port
        const hostRow = document.createElement("div");
        hostRow.className = "group";
        hostRow.style.display = "flex";
        hostRow.style.alignItems = "center";
        this.formElt.appendChild(hostRow);
        const hostnameHeader = document.createElement("label");
        hostnameHeader.textContent = i18n.t("common:server.hostname");
        hostnameHeader.style.marginRight = "0.5em";
        hostRow.appendChild(hostnameHeader);
        // TODO: Add a dropdownbox for HTTP or HTTPS
        this.hostnameInputElt = document.createElement("input");
        this.hostnameInputElt.placeholder = i18n.t("common:server.hostnamePlaceholder");
        this.hostnameInputElt.style.flex = "1 1 0";
        this.hostnameInputElt.style.marginRight = "0.5em";
        this.hostnameInputElt.required = true;
        this.hostnameInputElt.value = options.initialHostnameValue;
        hostRow.appendChild(this.hostnameInputElt);
        // Port
        const portHeader = document.createElement("label");
        portHeader.textContent = i18n.t("common:server.port");
        portHeader.style.marginRight = "0.5em";
        hostRow.appendChild(portHeader);
        this.portInputElt = document.createElement("input");
        this.portInputElt.style.width = "50px";
        this.portInputElt.value = options.initialPortValue;
        this.portInputElt.placeholder = "4237";
        hostRow.appendChild(this.portInputElt);
        // Label
        const labelRow = document.createElement("div");
        labelRow.className = "group";
        labelRow.style.display = "flex";
        labelRow.style.alignItems = "center";
        this.formElt.appendChild(labelRow);
        const labelHeader = document.createElement("label");
        labelHeader.textContent = i18n.t("common:server.label");
        labelHeader.style.marginRight = "0.5em";
        labelRow.appendChild(labelHeader);
        this.labelInputElt = document.createElement("input");
        this.labelInputElt.value = options.initialLabelValue;
        this.labelInputElt.placeholder = "A name for your server";
        this.labelInputElt.style.flex = "1 1 0";
        labelRow.appendChild(this.labelInputElt);
        // Password
        const passwordRow = document.createElement("div");
        passwordRow.className = "group";
        passwordRow.style.display = "flex";
        passwordRow.style.alignItems = "center";
        this.formElt.appendChild(passwordRow);
        const passwordHeader = document.createElement("label");
        passwordHeader.textContent = i18n.t("common:server.password");
        passwordHeader.style.marginRight = "0.5em";
        passwordRow.appendChild(passwordHeader);
        this.passwordInputElt = document.createElement("input");
        this.passwordInputElt.setAttribute("type", "password");
        this.passwordInputElt.value = options.initialPasswordValue;
        this.passwordInputElt.style.flex = "1 1 0";
        passwordRow.appendChild(this.passwordInputElt);
        // Buttons
        const buttonsElt = document.createElement("div");
        buttonsElt.className = "buttons";
        this.formElt.appendChild(buttonsElt);
        const cancelButtonElt = document.createElement("button");
        cancelButtonElt.type = "button";
        cancelButtonElt.textContent = i18n.t("common:actions.cancel");
        cancelButtonElt.className = "cancel-button";
        cancelButtonElt.addEventListener("click", (event) => { event.preventDefault(); this.cancel(); });
        this.validateButtonElt = document.createElement("button");
        this.validateButtonElt.textContent = options.validationLabel;
        this.validateButtonElt.className = "validate-button";
        if (navigator.platform === "Win32") {
            buttonsElt.appendChild(this.validateButtonElt);
            buttonsElt.appendChild(cancelButtonElt);
        }
        else {
            buttonsElt.appendChild(cancelButtonElt);
            buttonsElt.appendChild(this.validateButtonElt);
        }
        this.hostnameInputElt.focus();
    }
    submit() {
        const result = {
            id: null,
            hostname: this.hostnameInputElt.value,
            port: this.portInputElt.value !== "" ? this.portInputElt.value : null,
            label: this.labelInputElt.value,
            password: this.passwordInputElt.value
        };
        super.submit(result);
    }
}
exports.default = AddOrEditServerDialog;
