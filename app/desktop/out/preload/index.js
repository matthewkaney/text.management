"use strict";
const electron = require("electron");
function send(channel, value) {
  electron.ipcRenderer.send(channel, value);
}
function listen(channel) {
  return (handler) => {
    function handle(_, value) {
      handler(value);
    }
    electron.ipcRenderer.on(channel, handle);
    return () => {
      electron.ipcRenderer.off(channel, handle);
    };
  };
}
const ElectronAPI = {
  setCurrent(id) {
    send("current", { id });
  },
  onOpen: listen("open"),
  onContent: (id, handler) => listen("content")(({ withID, content }) => {
    if (id === withID) {
      handler(content);
    }
  }),
  onStatus: (id, handler) => listen("status")(({ withID, content }) => {
    if (id === withID) {
      handler(content);
    }
  }),
  update: (id, update) => {
    send("update", { withID: id, value: update });
  },
  requestClose: (id) => send("requestClose", { id }),
  newTab: () => send("newTab", void 0),
  onClose: listen("close"),
  onSetCurrent: listen("setCurrent"),
  onShowAbout: listen("showAbout"),
  evaluate: ({ code }) => {
    send("evaluation", code);
  },
  restart: () => {
    send("restart", void 0);
  },
  openTidalSettings: () => {
    send("openTidalSettings", void 0);
  },
  onConsoleMessage: listen("console"),
  onToggleConsole: listen("toggleConsole"),
  onTidalVersion: listen("tidalVersion"),
  onTidalNow: listen("tidalNow"),
  onTidalHighlight: listen("tidalHighlight"),
  onSettingsData: listen("settingsData")
};
electron.contextBridge.exposeInMainWorld("api", ElectronAPI);
