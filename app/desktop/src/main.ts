import { app, BrowserWindow, ipcMain, Menu } from "electron";

import { resolve } from "path";

// @ts-ignore
import squirrelStartup from "electron-squirrel-startup";
if (squirrelStartup) app.quit();

import fixPath from "fix-path";

fixPath();

import { GHCI } from "@management/lang-tidal";
import { Authority, DesktopTab } from "./authority";

import { getTemplate } from "./menu";

import { DocumentUpdate } from "@core/document";

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
      let { name$, saveState$, content } = tab as DesktopTab;

      send("open", id, name$.value, saveState$.value);

      name$.subscribe({
        next: (value) => {
          send(`doc-${id}-name`, value);
        },
      });

      saveState$.subscribe({
        next: (value) => {
          send(`doc-${id}-saved`, value);
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

    let unOpenMessage = authority.on("open", async ({ tab }) => {
      tidal.listenToDocument(await tab.content);
    });

    let unClose = authority.on("close", ({ id }) => {
      send("close", { id });
    });

    let unMessage = tidal.on("message", (m) => {
      send("console-message", m);
    });
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

async function saveAsFile(window?: BrowserWindow) {
  if (window) {
    let result = await dialog.showSaveDialog(window);

    if (result.canceled || !result.filePath) return;

    authority.saveDocAs(result.filePath);
  }
}

async function startSession() {
  authority.createSession();
}

async function joinSession() {}

async function closeSession() {}

let menuTemplate = getTemplate({
  newFile,
  openFile,
  saveAsFile,
  startSession,
  joinSession,
  closeSession,
});
let mainMenu = Menu.buildFromTemplate(menuTemplate);

Menu.setApplicationMenu(mainMenu);

authority.on("open", ({ tab }) => {
  if (tab instanceof DesktopTab) {
    tab.path$.subscribe({
      next: (path) => {
        let saveItem = mainMenu.getMenuItemById("save");
        if (saveItem) saveItem.enabled = !path;
      },
    });
  }
});
