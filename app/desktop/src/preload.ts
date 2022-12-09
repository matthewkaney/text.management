import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

import { TextManagementAPI } from "../../../packages/text-management/src/api";
import { TerminalMessage } from "../../../packages/text-management/src/server/ghci";

contextBridge.exposeInMainWorld("electronApp", true);

// Electron implementation of Text.Management API
const api: TextManagementAPI = {
  pushUpdate: (update) => ipcRenderer.invoke("push-update", update),

  onUpdate: (version, callback) => {
    return () => {};
  },

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
