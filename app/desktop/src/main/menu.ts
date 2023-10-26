import { EventEmitter } from "@core/events";
import { app, BrowserWindow, Menu, MenuItem } from "electron";
import { DesktopDocument } from "./filesystem";

const isWin = process.platform === "win32";
const isMac = process.platform === "darwin";

interface MenuEvents {
  newFile?: BrowserWindow;
  openFile?: BrowserWindow;
  saveFile?: BrowserWindow;
  saveAsFile?: BrowserWindow;
  settings?: BrowserWindow;
  close?: BrowserWindow;
  about?: BrowserWindow;
  rebootTidal?: BrowserWindow;
  aboutTidal?: BrowserWindow;
  toggleConsole?: BrowserWindow;
}

class ElectronMenu extends EventEmitter<MenuEvents> {
  // The main menu
  private menu = new Menu();

  // Menu items that will be modified
  private saveItem: MenuItem;
  private saveAsItem: MenuItem;
  private closeItem: MenuItem;

  constructor() {
    super();

    // Mac system menu
    if (isMac) {
      this.menu.append(
        new MenuItem({
          label: app.name,
          submenu: [
            {
              label: "About",
              click: (_, window) => this.emit("about", window),
            },
            { type: "separator" },
            { role: "hide" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" },
          ],
        })
      );
    }

    // File menu
    let fileMenu = new MenuItem({
      role: "fileMenu",
      submenu: [
        {
          label: "New",
          accelerator: "CommandOrControl+N",
          click: (_, window) => this.emit("newFile", window),
        },
        {
          label: "Open...",
          accelerator: "CommandOrControl+O",
          click: (_, window) => this.emit("openFile", window),
        },
      ],
    });

    this.saveItem = new MenuItem({
      id: "save",
      label: "Save",
      accelerator: "CommandOrControl+S",
      click: (_, window) => this.emit("saveFile", window),
    });
    fileMenu.submenu?.append(this.saveItem);

    this.saveAsItem = new MenuItem({
      id: "saveAs",
      label: "Save As...",
      accelerator: "CommandOrControl+Shift+S",
      click: (_, window) => this.emit("saveAsFile", window),
    });
    fileMenu.submenu?.append(this.saveAsItem);

    fileMenu.submenu?.append(new MenuItem({ type: "separator" }));

    fileMenu.submenu?.append(
      new MenuItem({
        label: "Settings",
        click: (_, window) => this.emit("settings", window),
      })
    );

    fileMenu.submenu?.append(new MenuItem({ type: "separator" }));

    this.closeItem = new MenuItem({
      id: "close",
      label: "Close Editor",
      accelerator: "CommandOrControl+W",
      click: (_, window) => this.emit("close", window),
    });
    fileMenu.submenu?.append(this.closeItem);

    if (!isMac) {
      fileMenu.submenu?.append(new MenuItem({ role: "quit" }));
    }

    this.menu.append(fileMenu);

    // Set initial file menu item states
    this.currentDoc = null;

    // Edit Menu
    this.menu.append(
      new MenuItem({
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
      })
    );

    // View Menu
    this.menu.append(
      new MenuItem({
        label: "View",
        submenu: [
          {
            label: "Toggle Console",
            accelerator: "CommandOrControl+`",
            click: (_, window) => this.emit("toggleConsole", window),
          },
          { type: "separator" },
          { role: "resetZoom" },
          { role: "zoomIn", accelerator: "CommandOrControl+=" },
          { role: "zoomOut" },
          { type: "separator" },
          { role: "togglefullscreen" },
        ],
      })
    );

    this.menu.append(
      new MenuItem({
        label: "Tidal",
        submenu: [
          {
            label: "Reboot Tidal",
            accelerator: "CommandOrControl+R",
            click: (_, window) => this.emit("rebootTidal", window),
          },
          // { type: "separator" },
          // { label: "About", click: () => {} },
        ],
      })
    );

    // Help Menu
    const helpMenu = new MenuItem({
      role: "help",
      submenu: [{ role: "toggleDevTools" }],
    });

    if (!isMac) {
      helpMenu.submenu?.append(new MenuItem({ type: "separator" }));
      helpMenu.submenu?.append(
        new MenuItem({
          label: "About",
          click: (_, window) => this.emit("about", window),
        })
      );
    }

    this.menu.append(helpMenu);

    // Set application menu
    Menu.setApplicationMenu(this.menu);
  }

  private _untrackDocument: (() => void) | null = null;
  private _currentDoc: DesktopDocument | null = null;

  get currentDoc() {
    return this._currentDoc;
  }

  set currentDoc(document) {
    if (this._untrackDocument) {
      this._untrackDocument();
      this._untrackDocument = null;
    }

    if (document) {
      const trackSaveState = () => {
        this.saveItem.enabled = document.saved !== true;
        this.saveAsItem.enabled = true;
        this.closeItem.enabled = true;

        let unStatus = document.on("status", () => {
          this.saveItem.enabled = document.saved !== true;
        });
        let unUpdate = document.on("update", () => {
          this.saveItem.enabled = document.saved !== true;
        });

        if (this._untrackDocument) this._untrackDocument();

        this._untrackDocument = () => {
          unStatus();
          unUpdate();
        };
      };

      if (document.content) {
        trackSaveState();
      } else {
        this.saveItem.enabled = false;
        this.saveAsItem.enabled = false;
        // TODO: Theoretically... loading documents should be closeable,
        // but I don't think it prevents the promise from resolving rn
        this.closeItem.enabled = false;

        this._untrackDocument = document.once("loaded", () => {
          trackSaveState();
        });
      }
    } else {
      this.saveItem.enabled = false;
      this.saveAsItem.enabled = false;
      this.closeItem.enabled = false;
    }

    this._currentDoc = document;
  }
}

export const menu = new ElectronMenu();
