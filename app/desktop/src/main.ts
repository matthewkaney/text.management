import { app, BrowserWindow } from "electron";
import { fileURLToPath } from "url";

import { GHCI } from "../../../packages/text-management/src/server/ghci";

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: fileURLToPath(new URL("preload.ts", import.meta.url)),
    },
  });

  win.loadFile("./renderer/index.html");

  let tidal = new GHCI();

  tidal.on("message", (m) => {
    win.webContents.send("console-message", m);
  });

  win.on("closed", () => {
    tidal.close();
  });
};

app.whenReady().then(() => {
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
