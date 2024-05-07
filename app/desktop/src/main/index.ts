import { app, BrowserWindow } from "electron";

import { resolve } from "path";

import fixPath from "fix-path";

fixPath();

import { autoUpdater } from "electron-updater";

autoUpdater.checkForUpdatesAndNotify();

import { GHCI } from "@management/lang-tidal";
import { Filesystem } from "./filesystem";
import { wrapIPC } from "./ipcMain";

import { menu } from "./menu";

const filesystem = new Filesystem();

const createWindow = () => {
  const window = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webPreferences: {
      preload: resolve(app.getAppPath(), "build/preload/index.js"),
      sandbox: process.env.NODE_ENV === "production",
    },
  });

  const tidal = new GHCI(resolve(app.getPath("userData")));

  let listeners: (() => void)[] = [];
  let docsListeners: { [id: string]: typeof listeners } = {};

  window.on("ready-to-show", () => {
    const [send, listen] = wrapIPC(window.webContents);

    listeners.push(
      listen("current", ({ id }) => {
        filesystem.currentDocID = id;
      })
    );

    // Attach file handlers
    listeners.push(
      filesystem.on("open", (document) => {
        let { id, path, content, saved } = document;

        let docListeners: typeof listeners = [];
        docsListeners[id] = docListeners;

        send("open", { id, path });

        if (content) {
          let { doc, version } = content;
          send("content", {
            withID: id,
            content: { doc: doc.toJSON(), version, saved },
          });
        } else {
          document.once("loaded", (content) => {
            send("content", {
              withID: id,
              content: { ...content, doc: content.doc.toJSON() },
            });
          });
        }

        docListeners.push(
          document.on("status", (status) => {
            send("status", { withID: id, content: status });
          })
        );

        docListeners.push(
          listen("update", ({ withID, value }) => {
            if (withID === id) {
              document.update(value);
            }
          })
        );
      })
    );

    listeners.push(
      filesystem.on("setCurrent", (id) => {
        send("setCurrent", { id });
      })
    );

    listeners.push(
      listen("newTab", () => {
        filesystem.loadDoc();
      })
    );

    listeners.push(
      listen("requestClose", async ({ id }) => {
        await close({ window, id });
      })
    );

    // Set up tidal communication
    tidal.getVersion().then((version) => {
      send("tidalVersion", version);
    });

    listeners.push(
      listen("evaluation", (code) => {
        tidal.send(code);
      })
    );

    listeners.push(
      menu.on("rebootTidal", () => {
        tidal.restart();
      })
    );

    listeners.push(
      menu.on("toggleConsole", () => {
        send("toggleConsole", undefined);
      })
    );

    listeners.push(
      menu.on("settings", async () => {
        let settingsDoc = filesystem.loadDoc(tidal.settingsPath, "{}");

        settingsDoc.on("status", ({ saved }) => {
          if (saved === true) {
            tidal.reloadSettings();
          }
        });
      })
    );

    listeners.push(
      tidal.on("message", (message) => {
        send("console", message);
      })
    );

    listeners.push(
      tidal.on("now", (now) => {
        send("tidalNow", now);
      })
    );

    // For now, load a blank document on startup
    filesystem.loadDoc();

    // Show the window
    window.show();
  });

  window.loadFile("./build/renderer/index.html");

  window.on("closed", () => {
    for (let listener of listeners) {
      listener();
    }
    listeners = [];

    for (let docListeners of Object.values(docsListeners)) {
      for (let listener of docListeners) {
        listener();
      }
    }
    docsListeners = {};

    tidal.close();
  });
};

app.whenReady().then(() => {
  createWindow();

  // app.on("activate", () => {
  //   if (BrowserWindow.getAllWindows().length === 0) createWindow();
  // });
});

// app.on("window-all-closed", () => {
//   if (process.platform !== "darwindow") app.quit();
// });

import { dialog } from "electron";

menu.on("newFile", newFile);
async function newFile() {
  filesystem.loadDoc();
}

menu.on("openFile", openFile);
async function openFile(window?: BrowserWindow) {
  if (window) {
    let result = await dialog.showOpenDialog(window, {
      properties: ["openFile"],
    });

    if (result.canceled) return;

    filesystem.loadDoc(result.filePaths[0]);
  } else {
    dialog.showOpenDialog({ properties: ["openFile"] });
  }
}

menu.on("saveFile", saveFile);
async function saveFile(window?: BrowserWindow) {
  if (window) {
    if (filesystem.currentDoc) {
      if (filesystem.currentDoc.path === null) {
        saveAsFile(window);
      } else {
        filesystem.currentDoc.save();
      }
    }
  }
}

menu.on("saveAsFile", saveAsFile);
async function saveAsFile(window?: BrowserWindow) {
  if (window) {
    let result = await dialog.showSaveDialog(window);

    if (result.canceled || !result.filePath) return;

    if (filesystem.currentDoc) {
      filesystem.currentDoc.save(result.filePath);
    }
  }
}

menu.on("close", (window?: BrowserWindow) => {
  close({ window });
});
interface CloseOptions {
  window?: BrowserWindow;
  id?: string | null;
}
async function close({ window, id }: CloseOptions) {
  if (!window) return;

  let [send] = wrapIPC(window.webContents);

  id = id ?? filesystem.currentDocID;
  let document = id ? filesystem.getDoc(id) : filesystem.currentDoc;

  if (!id || !document) throw Error("Tried to close a non-existent document");

  if (!document.saved) {
    let { response } = await dialog.showMessageBox(window, {
      type: "warning",
      message: "Do you want to save your changes?",
      buttons: ["Save", "Don't Save", "Cancel"],
    });

    // Cancelled
    if (response === 2) return;

    // Save
    if (response === 0) {
      if (document.path) {
        document.save();
      } else {
        let { canceled, filePath } = await dialog.showSaveDialog(window);

        if (!canceled && filePath) {
          document.save(filePath);
        }
      }
    }
  }

  // Close document
  await document.close();

  // We're done here, so close the file
  send("close", { id });
}

menu.on("about", showAbout);
function showAbout(window?: BrowserWindow) {
  if (window) {
    let [send] = wrapIPC(window.webContents);
    send("showAbout", app.getVersion());
  }
}

menu.currentDoc = filesystem.currentDoc;
filesystem.on("current", (doc) => {
  menu.currentDoc = doc;
});
