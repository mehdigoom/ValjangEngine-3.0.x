"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function fetch(url, options, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    if (options.httpAuth != null)
        xhr.setRequestHeader("Authorization", "Basic " + window.btoa(`${options.httpAuth.username}:${options.httpAuth.password}`));
    xhr.responseType = options.type;
    xhr.onload = (event) => {
        if (xhr.status !== 200 && xhr.status !== 0) {
            const error = new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
            error.status = xhr.status;
            callback(error);
            return;
        }
        callback(null, xhr.response);
    };
    xhr.onerror = (event) => {
        console.log(event);
        const error = new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
        error.status = xhr.status;
        callback(error);
    };
    xhr.send();
}
exports.default = fetch;
