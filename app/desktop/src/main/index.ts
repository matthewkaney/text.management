import { app, BrowserWindow, ipcMain, Menu } from "electron";

import { resolve } from "path";

// @ts-ignore
import squirrelStartup from "electron-squirrel-startup";
if (squirrelStartup) app.quit();

import fixPath from "fix-path";

fixPath();

import { GHCI } from "@management/lang-tidal";
import { Filesystem } from "./filesystem";

import { getTemplate } from "./menu";

import { DocumentUpdate } from "@core/api";

const filesystem = new Filesystem();

const tidal = new GHCI();

const createWindow = () => {
  const win = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webPreferences: {
      preload: resolve(app.getAppPath(), "dist/preload/index.js"),
    },
  });

  // TODO: IMPLEMENT
  let removeWindowHandlers = () => {};

  win.on("ready-to-show", () => {
    win.webContents.ipc.on("current", (_, id) => {
      filesystem.currentDocID = id;
    });

    // Attach file handlers
    let unOpen = filesystem.on("open", ({ id, doc }) => {
      let { path, content } = doc;

      win.webContents.send("open", id, path);

      let unPathChanged = doc.on("pathChanged", (path) => {
        win.webContents.send(`doc-${id}-path`, path);
      });

      let unSaved = doc.on("saved", (version) => {
        win.webContents.send(`doc-${id}-saved`, version);
      });

      win.webContents.ipc.on(
        `doc-${id}-update`,
        (_, update: DocumentUpdate, saveState: boolean) =>
          doc.update(update, saveState)
      );

      content.then(({ doc, version }) => {
        win.webContents.send(`doc-${id}-content`, doc.toJSON(), version);
      });
    });

    // For now, load a blank document on startup
    filesystem.loadDoc();

    // Show the window
    win.show();
  });

  win.loadFile("./dist/renderer/index.html");

  win.on("closed", () => {
    // unOpen();
    // unClose();
    // unMessage();
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

ipcMain.handle("tidal-version", () => {
  return tidal.getVersion();
});

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

let offSaveStateChanged: (() => void) | null = null;
updateSaveItem(false);
updateSaveAsItem(false);

function updateSaveItem(saveState: boolean) {
  let saveItem = mainMenu.getMenuItemById("save");
  if (saveItem) saveItem.enabled = !saveState;
}

function updateSaveAsItem(enabled: boolean) {
  let saveAsItem = mainMenu.getMenuItemById("saveAs");
  if (saveAsItem) saveAsItem.enabled = enabled;
}

filesystem.on("currentDocChanged", (doc) => {
  if (offSaveStateChanged) {
    offSaveStateChanged();
    offSaveStateChanged = null;
  }

  if (doc) {
    updateSaveItem(doc.path !== null && doc.saveState);
    offSaveStateChanged = doc.on("saveStateChanged", (saveState) => {
      updateSaveItem(doc.path !== null && saveState);
    });
    updateSaveAsItem(true);
  } else {
    updateSaveItem(false);
    updateSaveAsItem(false);
  }
});
