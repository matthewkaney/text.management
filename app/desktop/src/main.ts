import { app, BrowserWindow, ipcMain } from "electron";

// @ts-ignore
import squirrelStartup from "electron-squirrel-startup";
if (squirrelStartup) app.quit();

import { fileURLToPath } from "url";

import fixPath from "fix-path";

fixPath();

import { GHCI } from "@management/lang-tidal";
import { Authority } from "./authority";
import { TerminalMessage } from "@core/api";

interface Engine {
  process: GHCI;
  authority: Authority;
}

const engineMap = new Map<number, Engine>();

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: fileURLToPath(new URL("preload.ts", import.meta.url)),
    },
  });

  win.loadFile("./dist/renderer/index.html");

  let authority = new Authority();

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

ipcMain.handle("open-file", (event) => {
  let window = BrowserWindow.fromWebContents(event.sender);

  if (window) {
    return dialog.showOpenDialog(window, { properties: ["openFile"] });
  } else {
    return { cancelled: true };
  }
});

ipcMain.handle("tidal-version", (event) => {
  let engine = engineMap.get(event.sender.id);

  if (engine) {
    return engine.process.getVersion();
  }
});
