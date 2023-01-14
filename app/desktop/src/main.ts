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

import { DocumentUpdate } from "@core/api";

const authority = new Authority();

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

  win.on("ready-to-show", () => {
    win.show();
  });

  function send(channel: string, ...args: any[]) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, ...args);
    }
  }

  win.webContents.ipc.once("api-ready", () => {
    let unOpen = authority.on("open", ({ id, tab }) => {
      let { name$, content } = tab;

      send("open", id, name$.value);

      name$.subscribe({
        next: (value) => {
          send(`doc-${id}-name`, value);
        },
      });

      content.then((content) => {
        win.webContents.ipc.handle(
          `doc-${id}-push-update`,
          (_, update: DocumentUpdate) => content.pushUpdate(update)
        );

        let { initialText, initialVersion, updates$ } = content;

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

ipcMain.handle("tidal-version", (event) => {
  return tidal.getVersion();
});

async function newFile(window?: BrowserWindow) {
  authority.loadDoc();
}

async function openFile(window?: BrowserWindow) {
  if (window) {
    let result = await dialog.showOpenDialog(window, {
      properties: ["openFile"],
    });

    if (result.canceled) return;

    authority.loadDoc(result.filePaths[0]);
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
