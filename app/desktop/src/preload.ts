import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

import { TextManagementAPI, TerminalMessage, DocUpdate } from "@core/api";

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

    // Terminal Messages
    ipcRenderer.on("console-message", (_, message: TerminalMessage) => {
      this.emit("consoleMessage", message);
    });
  }

  pushUpdate(update: DocUpdate) {
    return ipcRenderer.invoke("push-update", update);
  }

  getTidalVersion() {
    return ipcRenderer.invoke("tidal-version");
  }
}

const api = new ElectronAPI();

contextBridge.exposeInMainWorld("api", {
  on: api.on.bind(api),
  pushUpdate: api.pushUpdate.bind(api),
  getTidalVersion: api.getTidalVersion.bind(api),
});
