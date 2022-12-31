import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from "electron";

const isMac = process.platform === "darwin";

export function getTemplate(
  open: (window: BrowserWindow | undefined) => void
): MenuItemConstructorOptions[] {
  let template: MenuItemConstructorOptions[] = [
    {
      role: "fileMenu",
      submenu: [
        { label: "New", accelerator: "Ctrl+N" },
        {
          label: "Open",
          accelerator: "Ctrl+O",
          click: (_, window) => open(window),
        },
        { label: "Save", accelerator: "Ctrl+S" },
        { label: "Save As", accelerator: "Ctrl+Shift+S" },
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
