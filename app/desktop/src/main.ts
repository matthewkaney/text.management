import { app, BrowserWindow, ipcMain, Menu } from "electron";

import { resolve } from "path";

// @ts-ignore
import squirrelStartup from "electron-squirrel-startup";
if (squirrelStartup) app.quit();

import fixPath from "fix-path";

fixPath();

import { GHCI } from "@management/lang-tidal";
import { Authority } from "./authority";
import { TerminalMessage } from "@core/api";

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

  authority.on("doc", (loadedDoc) => {
    let { doc, ...docParams } = loadedDoc;
    win.webContents.send("doc", docParams);
    doc.then((content) => win.webContents.send("doc-content", content));
  });

  let tidal = new GHCI();

  authority.on("code", (code) => {
    tidal.send(code);
  });

  function dispatchMessage(m: TerminalMessage) {
    win.webContents.send("console-message", m);
  }

  tidal.on("message", dispatchMessage);

  win.on("closed", () => {
    tidal.off("message", dispatchMessage);
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

async function open(window: BrowserWindow | undefined) {
  if (window) {
    let result = await dialog.showOpenDialog(window, {
      properties: ["openFile"],
    });

    if (result.canceled) return;

    engineMap.get(window.webContents.id)?.authority.reload(result.filePaths[0]);
  } else {
    dialog.showOpenDialog({ properties: ["openFile"] });
  }
}

let menuTemplate = getTemplate(open);

Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
