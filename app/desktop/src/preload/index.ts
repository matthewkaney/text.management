import { contextBridge, ipcRenderer } from "electron";

import { TerminalMessage, DocUpdate } from "@core/api";

import { ProxyAPI } from "./proxyAPI";

let proxied = false;

function proxyAPI(api: ProxyAPI) {
  if (proxied) throw Error("Trying to proxy API twice");

  let { onOpen, onClose, onConsoleMessage, onTidalVersion } = api;

  ipcRenderer.on("open", (_, id: number, name: string) => {
    const update = (update: DocUpdate) =>
      ipcRenderer.invoke(`doc-${id}-push-update`, update);

    let { onContent, onName, onUpdate } = onOpen({ id, name, update });

    ipcRenderer.on(
      `doc-${id}-content`,
      (_, initialText: string[], initialVersion: number) => {
        onContent({ initialText, initialVersion });
      }
    );

    ipcRenderer.on(`doc-${id}-name`, (_, name: string) => {
      onName(name);
    });

    ipcRenderer.on(`doc-${id}-update`, (_, update: DocUpdate) => {
      onUpdate(update);
    });
  });

  ipcRenderer.on("close", (_, id: number) => {
    ipcRenderer.removeAllListeners(`doc-${id}-content`);
    ipcRenderer.removeAllListeners(`doc-${id}-name`);
    ipcRenderer.removeAllListeners(`doc-${id}-update`);
    onClose(id);
  });

  ipcRenderer.on("console-message", (_, message: TerminalMessage) => {
    onConsoleMessage(message);
  });

  ipcRenderer.invoke("tidal-version").then((version: string) => {
    onTidalVersion(version);
  });

  proxied = true;
  ipcRenderer.send("api-ready");
}

contextBridge.exposeInMainWorld("proxyAPI", proxyAPI);
