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

const authority = new Authority();

const createWindow = () => {
  const win = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webPreferences: {
      preload: resolve(app.getAppPath(), "dist/preload/index.js"),
    },
  });

  win.on("ready-to-show", () => {
    win.show();
  });

  function send(channel: string, ...args: any[]) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, ...args);
    }
  }

  win.webContents.ipc.once("api-ready", () => {
    let unOpen = authority.on("open", ({ id, doc }) => {
      win.webContents.ipc.handle(
        `doc-${id}-push-update`,
        (_, update: DocUpdate) => authority.doc.pushUpdate(update)
      );

      let { name$, snapshot } = doc;

      send("open", id, name$.value);

      name$.subscribe({
        next: (value) => {
          send(`doc-${id}-name`, value);
        },
      });

      snapshot.then(({ initialText, initialVersion, updates$ }) => {
        send(`doc-${id}-content`, initialText.toJSON(), initialVersion);

        updates$.subscribe({
          next: (update) => {
            send(`doc-${id}-update`, update);
          },
        });
      });
    });

    let unClose = authority.on("close", ({ id }) => {
      if (!win.isDestroyed()) {
        win.webContents.send("close", { id });
      }
    });
  });

  win.loadFile("./dist/renderer/index.html");

  let tidal = new GHCI();

  let unCode = authority.on("code", (code) => {
    tidal.send(code);
  });

  let unMessage = tidal.on("message", (m) => {
    if (!win.isDestroyed()) {
      win.webContents.send("console-message", m);
    }
  });

  win.on("closed", () => {
    // unOpen();
    // unClose();
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

import { dialog } from "electron";
import { DocUpdate } from "@core/api";

ipcMain.handle("tidal-version", (event) => {
  let engine = engineMap.get(event.sender.id);

  if (engine) {
    return engine.process.getVersion();
  }
});

async function newFile(window?: BrowserWindow) {
  if (window) {
    engineMap.get(window.webContents.id)?.authority.loadDoc();
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

async function saveFile(window?: BrowserWindow) {
  if (window) {
    let result = await dialog.showSaveDialog(window);

    // engineMap.get(window.webContents.id)?.authority.saveDoc();
  }
}

async function saveAsFile(window?: BrowserWindow) {
  if (window) {
    let result = await dialog.showSaveDialog(window);

    if (result.canceled || !result.filePath) return;

    // engineMap.get(window.webContents.id)?.authority.saveAsDoc(result.filePath);
  }
}

let menuTemplate = getTemplate({ newFile, openFile, saveFile, saveAsFile });

Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
