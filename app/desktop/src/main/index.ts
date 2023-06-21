import { app, BrowserWindow, Menu } from "electron";

import { resolve } from "path";

// @ts-ignore
import squirrelStartup from "electron-squirrel-startup";
if (squirrelStartup) app.quit();

import fixPath from "fix-path";

fixPath();

import { GHCI } from "@management/lang-tidal";
import { Filesystem, DesktopDocument } from "./filesystem";
import { wrapIPC } from "./ipcMain";

import { getTemplate } from "./menu";

const filesystem = new Filesystem();

const createWindow = () => {
  const win = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webPreferences: {
      preload: resolve(app.getAppPath(), "dist/preload/index.js"),
    },
  });

  const tidal = new GHCI();

  // TODO: IMPLEMENT
  let listeners: (() => void)[] = [];
  let docsListeners: { [id: string]: typeof listeners } = {};

  win.on("ready-to-show", () => {
    const [send, listen] = wrapIPC(win.webContents);

    listeners.push(
      listen("current", ({ id }) => {
        filesystem.currentDocID = id;
      })
    );

    // Attach file handlers
    listeners.push(
      filesystem.on("open", ({ id, document }) => {
        let docListeners: typeof listeners = [];
        docsListeners[id] = docListeners;

        let { path, content, saved } = document;

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
            win.webContents.send("status", { withID: id, content: status });
          })
        );

        docListeners.push(
          listen("update", ({ withID, value }) => {
            if (withID === id) {
              document.update(value);
            }
          })
        );

        docListeners.push(
          listen("requestClose", async ({ id: withID }) => {
            if (withID === id) {
              if (document.saved !== false) {
                // TODO: Implement menu item here...
              }
            }
          })
        );
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
      tidal.on("message", (message) => {
        send("console", message);
      })
    );

    // For now, load a blank document on startup
    filesystem.loadDoc();

    // Show the window
    win.show();
  });

  win.loadFile("./dist/renderer/index.html");

  win.on("closed", () => {
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
//   if (process.platform !== "darwin") app.quit();
// });

import { dialog } from "electron";

async function newFile() {
  filesystem.loadDoc();
}

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

async function saveAsFile(window?: BrowserWindow) {
  if (window) {
    let result = await dialog.showSaveDialog(window);

    if (result.canceled || !result.filePath) return;

    if (filesystem.currentDoc) {
      filesystem.currentDoc.save(result.filePath);
    }
  }
}

function showAbout(window?: BrowserWindow) {
  if (window) {
    window.webContents.send("show-about", app.getVersion());
  }
}

let menuTemplate = getTemplate({
  newFile,
  openFile,
  saveFile,
  saveAsFile,
  showAbout,
});
let mainMenu = Menu.buildFromTemplate(menuTemplate);

Menu.setApplicationMenu(mainMenu);

// TODO: Get a better reference to these menu items so it doesn't require the typecast
let saveItem = mainMenu.getMenuItemById("save") as Electron.MenuItem;
let saveAsItem = mainMenu.getMenuItemById("saveAs") as Electron.MenuItem;

let untrackDocument: (() => void) | null = null;

function updateSaveMenu(document: DesktopDocument | null) {
  if (untrackDocument) {
    untrackDocument();
    untrackDocument = null;
  }

  if (document) {
    const trackSaveState = () => {
      saveItem.enabled = document.saved !== true;
      saveAsItem.enabled = true;

      let unStatus = document.on("status", () => {
        saveItem.enabled = document.saved !== true;
      });
      let unUpdate = document.on("update", () => {
        saveItem.enabled = document.saved !== true;
      });

      if (untrackDocument) untrackDocument();

      untrackDocument = () => {
        unStatus();
        unUpdate();
      };
    };

    if (document.content) {
      trackSaveState();
    } else {
      saveItem.enabled = false;
      saveAsItem.enabled = false;

      untrackDocument = document.once("loaded", () => {
        trackSaveState();
      });
    }
  } else {
    saveItem.enabled = false;
    saveAsItem.enabled = false;
  }
}

updateSaveMenu(filesystem.currentDoc);
filesystem.on("current", updateSaveMenu);
