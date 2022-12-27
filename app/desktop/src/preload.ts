import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

import { TextManagementAPI, TerminalMessage } from "@core/api";

// Electron implementation of Text.Management API
const api: TextManagementAPI = {
  pushUpdate: (update) => ipcRenderer.invoke("push-update", update),

  onUpdate: (version, callback) => {
    return () => {};
  },

  getTidalVersion: () => ipcRenderer.invoke("tidal-version"),

  listenForConsole: (callback) => {
    const wrappedCallback = (_: IpcRendererEvent, message: TerminalMessage) => {
      callback(message);
    };

    ipcRenderer.on("console-message", wrappedCallback);

    return () => {
      ipcRenderer.off("console-message", wrappedCallback);
    };
  },
};

contextBridge.exposeInMainWorld("api", api);
