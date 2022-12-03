// preload with contextIsolation enabled
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronApp", true);

contextBridge.exposeInMainWorld("ipcSend", ipcRenderer.send);

window.electronApp = true;
