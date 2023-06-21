import { contextBridge, ipcRenderer } from "electron";

import { ToMainChannels, ToRendererChannels, Handler } from "../ipc";

import { TerminalMessage, DocumentUpdate } from "@core/api";

function send<K extends keyof ToMainChannels>(
  channel: K,
  value: ToMainChannels[K]
) {
  ipcRenderer.send(channel, value);
}

function listen<K extends keyof ToRendererChannels>(channel: K) {
  return (handler: Handler<ToRendererChannels[K]>) => {
    function handle(_: any, value: ToRendererChannels[K]) {
      handler(value);
    }

    ipcRenderer.on(channel, handle);

    return () => {
      ipcRenderer.off(channel, handle);
    };
  };
}

export type { ElectronAPI };

const ElectronAPI = {
  setCurrent(id: string | null) {
    ipcRenderer.send("current", id);
  },

  onOpen: listen("open"),

  onContent: (
    id: string,
    handler: Handler<ToRendererChannels["content"]["content"]>
  ) =>
    listen("content")(({ withID, content }) => {
      if (id === withID) {
        handler(content);
      }
    }),

  onStatus: (
    id: string,
    handler: Handler<ToRendererChannels["status"]["content"]>
  ) =>
    listen("status")(({ withID, content }) => {
      if (id === withID) {
        handler(content);
      }
    }),

  update: (id: string, update: DocumentUpdate) => {
    send("update", { withID: id, value: update });
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

contextBridge.exposeInMainWorld("api", ElectronAPI);
