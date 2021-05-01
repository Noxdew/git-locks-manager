const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs");
const i18nextBackend = require("i18next-electron-fs-backend");
const Store = require("secure-electron-store").default;
const ContextMenu = require("secure-electron-context-menu").default;
const git = require("./git");
const process = require('process');
const os = require('os');
const compareVersions = require('compare-versions');

// Create the electron store to be made available in the renderer process
const store = new Store();

let osVersion;
if (process.platform === 'darwin') {
  osVersion = 'getSystemVersion' in process
    ? process.getSystemVersion()
    : undefined;
} else {
  osVersion = os.release();
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  i18nextElectronBackend: i18nextBackend.preloadBindings(ipcRenderer),
  store: store.preloadBindings(ipcRenderer, fs),
  contextMenu: ContextMenu.preloadBindings(ipcRenderer),
  git,
  env: {
    win: process.platform === 'win32',
    mac: process.platform === 'darwin',
    linux: process.platform === 'linux',
    isBitSurOrLater: process.platform === 'darwin' && osVersion && compareVersions(osVersion, '10.16', '>='),
  },
  ipc: {
    on(c, h) {
      ipcRenderer.on(c, h);
    },
    send(c, d) {
      ipcRenderer.send(c, d);
    },
    removeAllListeners(c) {
      ipcRenderer.removeAllListeners(c);
    }
  }
});
