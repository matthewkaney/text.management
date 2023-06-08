import { contextBridge, ipcRenderer } from "electron";

import { TerminalMessage, DocumentUpdate } from "@core/api";

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

  onConsoleMessage: (handler: Handler<TerminalMessage>) => {},

  getTidalVersion: () => {
    return new Promise<string>(() => {});
  },

  requestClose: (id: string) => {},

  onClose: (id: string, handler: Handler<void>) => {},

  onShowAbout: (handler: Handler<string>) => {
    function handleShowAbout(_: any, appVersion: string) {
      handler(appVersion);
    }

    ipcRenderer.on("show-about", handleShowAbout);

    return () => {
      ipcRenderer.off("show-about", handleShowAbout);
    };
  },
};

contextBridge.exposeInMainWorld("api", api);
