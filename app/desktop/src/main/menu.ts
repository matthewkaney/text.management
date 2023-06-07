import { app, BrowserWindow, MenuItemConstructorOptions } from "electron";

const isWin = process.platform === "win32";
const isMac = process.platform === "darwin";

interface MenuActions {
  newFile: (window?: BrowserWindow) => void;
  openFile: (window?: BrowserWindow) => void;
  saveAsFile: (window?: BrowserWindow) => void;
}

export function getTemplate(
  actions: MenuActions
): MenuItemConstructorOptions[] {
  let template: MenuItemConstructorOptions[] = [];

  if (isMac) {
    template.push({
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "hide" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    });
  }

  template.push(
    {
      role: "fileMenu",
      submenu: [
        {
          label: "New",
          accelerator: "CommandOrControl+N",
          click: (_, window) => actions.newFile(window),
        },
        {
          label: "Open...",
          accelerator: "CommandOrControl+O",
          click: (_, window) => actions.openFile(window),
        },
        {
          id: "save",
          label: "Save",
          accelerator: "CommandOrControl+S",
          click: (_, window) => actions.saveAsFile(window),
        },
        {
          label: "Save As...",
          accelerator: "CommandOrControl+Shift+S",
          click: (_, window) => actions.saveAsFile(window),
        },
        { type: "separator" },
        { role: isMac ? "close" : "quit" },
      ],
    },
    {
      role: "editMenu",
      submenu: [
        {
          label: "Undo",
          accelerator: "CommandOrControl+Z",
          click: (_, window, { triggeredByAccelerator }) => {
            if (window && !triggeredByAccelerator) {
              window.webContents.sendInputEvent({
                type: "keyDown",
                keyCode: "Ctrl",
              });

              window.webContents.sendInputEvent({
                type: "keyDown",
                keyCode: "Z",
                modifiers: ["control"],
              });

              window.webContents.sendInputEvent({
                type: "keyUp",
                keyCode: "Z",
                modifiers: ["control"],
              });

              window.webContents.sendInputEvent({
                type: "keyUp",
                keyCode: "Ctrl",
              });
            }
          },
        },
        {
          label: "Redo",
          accelerator: isWin
            ? "CommandOrControl+Y"
            : "CommandOrControl+Shift+Z",
          click: (_, window, { triggeredByAccelerator }) => {
            if (window && !triggeredByAccelerator) {
              window.webContents.sendInputEvent({
                type: "keyDown",
                keyCode: "Ctrl",
              });

              window.webContents.sendInputEvent({
                type: "keyDown",
                keyCode: "Shift",
              });

              window.webContents.sendInputEvent({
                type: "keyDown",
                keyCode: "Z",
                modifiers: ["control", "shift"],
              });

              window.webContents.sendInputEvent({
                type: "keyUp",
                keyCode: "Z",
                modifiers: ["control", "shift"],
              });

              window.webContents.sendInputEvent({
                type: "keyUp",
                keyCode: "Shift",
              });

              window.webContents.sendInputEvent({
                type: "keyUp",
                keyCode: "Ctrl",
              });
            }
          },
        },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
      ],
    },
    { role: "viewMenu" },
    { role: "windowMenu" }
  );

  return template;
}
