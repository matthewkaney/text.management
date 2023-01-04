import { contextBridge, ipcRenderer } from "electron";

import { TextManagementAPI, TerminalMessage, DocUpdate, Doc } from "@core/api";

import { FileMetadata } from "./doc";

// Electron implementation of Text.Management API
class ElectronAPI extends TextManagementAPI {
  constructor() {
    super();

    // Loaded doc
    ipcRenderer.on("open", (_, { name, id }) => {
      let thisDoc: Doc = {
        name,
        id,
        doc: new Promise((resolve) => {
          ipcRenderer.once(`doc-${id}`, (_, content) => {
            resolve(content);
          });
        }),
      };

      this.onListener["open"] = (listener) => {
        listener(thisDoc);
      };

      this.emit("open", thisDoc);
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
