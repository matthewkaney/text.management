import { contextBridge, ipcRenderer } from "electron";

import { TerminalMessage, DocumentUpdate } from "@core/api";

import { ProxyAPI } from "./proxyAPI";

let proxied = false;

type Handler<T> = (event: T) => void;

export type ElectronAPI = typeof api;

const api = {
  setCurrent(id: string | null) {
    ipcRenderer.send("current", id);
  },

  onOpen: (handler: Handler<{ id: string; path: string | null }>) => {
    function handleOpen(_: any, id: string, path: string | null) {
      handler({ id, path });
    }

    ipcRenderer.on("open", handleOpen);

    return () => {
      ipcRenderer.off("open", handleOpen);
    };
  },

  update: (id: string, update: DocumentUpdate, saveState: boolean) => {
    ipcRenderer.send(`doc-${id}-update`, update, saveState);
  },

  onContent: (
    id: string,
    handler: Handler<{ doc: string[]; version: number }>
  ) => {
    function handleContent(_: any, doc: string[], version: number) {
      handler({ doc, version });
    }
    ipcRenderer.on(`doc-${id}-content`, handleContent);

    return () => {
      ipcRenderer.off(`doc-${id}-content`, handleContent);
    };
  },

  onPath: (id: string, handler: Handler<string>) => {
    function handlePath(_: any, path: string) {
      handler(path);
    }

    ipcRenderer.on(`doc-${id}-path`, handlePath);

    return () => {
      ipcRenderer.off(`doc-${id}-path`, handlePath);
    };
  },

  onSaved: (id: string, handler: Handler<number>) => {
    function handleSaved(_: any, version: number) {
      handler(version);
    }

    ipcRenderer.on(`doc-${id}-saved`, handleSaved);

    return () => {
      ipcRenderer.off(`doc-${id}-saved`, handleSaved);
    };
  },
};

function proxyAPI(api: ProxyAPI) {
  if (proxied) throw Error("Trying to proxy API twice");

  let { onOpen, onClose, onConsoleMessage, onTidalVersion } = api;

  ipcRenderer.on("open", (_, id: string, path: string | null) => {
    const update = (update: DocumentUpdate) =>
      ipcRenderer.send(`doc-${id}-update`, update);

    let { onContent, onPath, onSaved } = onOpen({
      id,
      path,
      update,
    });

    ipcRenderer.on(`doc-${id}-content`, (_, doc: string[], version: number) => {
      onContent({ doc, version });
    });

    ipcRenderer.on(`doc-${id}-path`, (_, path: string) => {
      onPath(path);
    });

    ipcRenderer.on(`doc-${id}-saved`, (_, version: number) => {
      onSaved(version);
    });
  });

  ipcRenderer.on("close", (_, id: string) => {
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

contextBridge.exposeInMainWorld("api", api);
