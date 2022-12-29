import {
  contextBridge,
  ipcRenderer,
  IpcRendererEvent,
  OpenDialogOptions,
} from "electron";

import { TextManagementAPI, TerminalMessage } from "@core/api";

interface FileAPI {
  openFile: () => Promise<OpenDialogOptions>;
}

// Electron implementation of Text.Management API
const api: TextManagementAPI & FileAPI = {
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

  openFile: () => ipcRenderer.invoke("open-file"),
};

contextBridge.exposeInMainWorld("api", api);
