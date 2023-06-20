import { app, BrowserWindow, ipcMain, Menu } from "electron";

import { resolve } from "path";

// @ts-ignore
import squirrelStartup from "electron-squirrel-startup";
if (squirrelStartup) app.quit();

import fixPath from "fix-path";

fixPath();

import { GHCI } from "@management/lang-tidal";
import { Filesystem, DesktopDocument } from "./filesystem";

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
    let unOpen = filesystem.on("open", ({ id, document }) => {
      let { path, content } = document;

      win.webContents.send("open", id, path);

      if (content) {
        let { doc, version } = content;
        win.webContents.send(
          `doc-${id}-content`,
          doc.toJSON(),
          version,
          document.saved
        );
      } else {
        document.once("loaded", ({ doc, version, saved }) => {
          win.webContents.send(
            `doc-${id}-content`,
            doc.toJSON(),
            version,
            saved
          );
        });
      }

      let unStatus = document.on("status", (status) => {
        win.webContents.send(`doc-${id}-status`, status);
      });

      win.webContents.ipc.on(`doc-${id}-update`, (_, update: DocumentUpdate) =>
        document.update(update)
      );
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

function updateSaveItem(enabled: boolean) {
  let saveItem = mainMenu.getMenuItemById("save");
  if (saveItem) saveItem.enabled = enabled;
}

function updateSaveAsItem(enabled: boolean) {
  let saveAsItem = mainMenu.getMenuItemById("saveAs");
  if (saveAsItem) saveAsItem.enabled = enabled;
}

let offSaveStateChanged: (() => void) | null = null;

function updateSaveMenu(document: DesktopDocument | null) {
  if (offSaveStateChanged) {
    offSaveStateChanged();
    offSaveStateChanged = null;
  }

  // if (document) {
  //   updateSaveItem(doc.path === null || !doc.saveState);
  //   offSaveStateChanged = doc.on("saveStateChanged", (saveState) => {
  //     updateSaveItem(doc.path === null || !saveState);
  //   });
  //   updateSaveAsItem(true);
  // } else {
  //   updateSaveItem(false);
  //   updateSaveAsItem(false);
  // }
}

updateSaveMenu(filesystem.currentDoc);
filesystem.on("current", updateSaveMenu);
