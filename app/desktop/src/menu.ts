import { app, BrowserWindow, MenuItemConstructorOptions } from "electron";

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
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" }
  );

  return template;
}
