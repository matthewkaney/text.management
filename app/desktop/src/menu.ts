import { app, BrowserWindow, MenuItemConstructorOptions } from "electron";

const isMac = process.platform === "darwin";

interface MenuActions {
  newFile: (window?: BrowserWindow) => void;
  openFile: (window?: BrowserWindow) => void;
  saveFile: (window?: BrowserWindow) => void;
  saveAsFile: (window?: BrowserWindow) => void;
}

export function getTemplate(
  actions: MenuActions
): MenuItemConstructorOptions[] {
  let template: MenuItemConstructorOptions[] = [
    {
      role: "fileMenu",
      submenu: [
        {
          label: "New",
          accelerator: "Ctrl+N",
          click: (_, window) => actions.newFile(window),
        },
        {
          label: "Open",
          accelerator: "Ctrl+O",
          click: (_, window) => actions.openFile(window),
        },
        {
          label: "Save",
          accelerator: "Ctrl+S",
          click: (_, window) => actions.saveFile(window),
        },
        {
          label: "Save As",
          accelerator: "Ctrl+Shift+S",
          click: (_, window) => actions.saveAsFile(window),
        },
        { type: "separator" },
        { role: isMac ? "close" : "quit" },
      ],
    },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ];

  if (isMac) {
    template.unshift({
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

  return template;
}
