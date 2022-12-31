import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

import { TextManagementAPI, TerminalMessage, DocUpdate, Doc } from "@core/api";

// Electron implementation of Text.Management API
class ElectronAPI extends TextManagementAPI {
  constructor() {
    super();

    // Loaded doc
    ipcRenderer.on("doc", (_, docParams) => {
      let thisDoc = {
        ...docParams,
        doc: new Promise((resolve) => {
          ipcRenderer.once("doc-content", (_, content) => {
            resolve(content);
          });
        }),
      };

      this.onListener["doc"] = (listener) => {
        listener(thisDoc);
      };

      this.emit("doc", thisDoc);
    });
  }

  pushUpdate(update: DocUpdate) {
    return ipcRenderer.invoke("push-update", update);
  }

  getTidalVersion() {
    return ipcRenderer.invoke("tidal-version");
  }

  listenForConsole(callback: (message: TerminalMessage) => void) {
    const wrappedCallback = (_: IpcRendererEvent, message: TerminalMessage) => {
      callback(message);
    };

    ipcRenderer.on("console-message", wrappedCallback);

    return () => {
      ipcRenderer.off("console-message", wrappedCallback);
    };
  }
}

const api = new ElectronAPI();

contextBridge.exposeInMainWorld("api", {
  on: api.on.bind(api),
  pushUpdate: api.pushUpdate.bind(api),
  getTidalVersion: api.getTidalVersion.bind(api),
  listenForConsole: api.listenForConsole.bind(api),
});
