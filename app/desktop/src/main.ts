import { app, BrowserWindow, ipcMain, Menu } from "electron";

import { resolve } from "path";

// @ts-ignore
import squirrelStartup from "electron-squirrel-startup";
if (squirrelStartup) app.quit();

import fixPath from "fix-path";

fixPath();

import { GHCI } from "@management/lang-tidal";
import { Authority } from "./authority";

import { getTemplate } from "./menu";

interface Engine {
  process: GHCI;
  authority: Authority;
}

const engineMap = new Map<number, Engine>();

const createWindow = () => {
  const win = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webPreferences: {
      preload: resolve(app.getAppPath(), "dist/preload.js"),
    },
  });

  win.on("ready-to-show", () => {
    win.show();
  });

  win.loadFile("./dist/renderer/index.html");

  let authority = new Authority();

  let unDoc = authority.on("doc", (loadedDoc) => {
    let { doc, ...docParams } = loadedDoc;
    win.webContents.send("doc", docParams);
    doc.then((content) => win.webContents.send("doc-content", content));
  });

  let tidal = new GHCI();

  let unCode = authority.on("code", (code) => {
    tidal.send(code);
  });

  let unMessage = tidal.on("message", (m) => {
    win.webContents.send("console-message", m);
  });

  win.on("closed", () => {
    unDoc();
    unCode();
    unMessage();
    tidal.close();
  });

  engineMap.set(win.webContents.id, { process: tidal, authority });
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("push-update", (event, update) => {
  let engine = engineMap.get(event.sender.id);

  if (engine) {
    return engine.authority.pushUpdate(update);
  } else {
    return false;
  }
});

import { dialog } from "electron";

ipcMain.handle("tidal-version", (event) => {
  let engine = engineMap.get(event.sender.id);

  if (engine) {
    return engine.process.getVersion();
  }
});

async function newFile(window?: BrowserWindow) {
  if (window) {
    engineMap.get(window.webContents.id)?.authority.newDoc();
  }
}

async function openFile(window?: BrowserWindow) {
  if (window) {
    let result = await dialog.showOpenDialog(window, {
      properties: ["openFile"],
    });

    if (result.canceled) return;

    engineMap
      .get(window.webContents.id)
      ?.authority.loadDoc(result.filePaths[0]);
  } else {
    dialog.showOpenDialog({ properties: ["openFile"] });
  }
}

async function saveFile(window?: BrowserWindow) {}

async function saveAsFile(window?: BrowserWindow) {}

let menuTemplate = getTemplate({ newFile, openFile, saveFile, saveAsFile });

Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
