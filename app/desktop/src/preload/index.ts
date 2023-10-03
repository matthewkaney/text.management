import { contextBridge, ipcRenderer } from "electron";

import { ToMainChannels, ToRendererChannels, Handler } from "../ipc";

import { DocumentUpdate } from "@core/api";

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
    send("current", { id });
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

  requestClose: (id: string) => send("requestClose", { id }),

  onClose: listen("close"),

  onSetCurrent: listen("setCurrent"),

  onShowAbout: listen("showAbout"),

  evaluate: (code: string) => {
    send("evaluation", code);
  },

  restart: () => {
    send("restart", undefined);
  },

  openTidalSettings: () => {
    send("openTidalSettings", undefined);
  },

  onConsoleMessage: listen("console"),

  onTidalVersion: listen("tidalVersion"),

  onTidalNow: listen("tidalNow"),
};

contextBridge.exposeInMainWorld("api", ElectronAPI);
