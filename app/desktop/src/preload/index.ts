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

  requestClose: (id: string) => {},

  onClose: (id: string, handler: Handler<void>) => {},

  onShowAbout: listen("showAbout"),

  evaluate: (code: string) => {
    send("evaluation", code);
  },

  onConsoleMessage: listen("console"),

  onTidalVersion: listen("tidalVersion"),
};

contextBridge.exposeInMainWorld("api", ElectronAPI);
