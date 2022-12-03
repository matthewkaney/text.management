// preload with contextIsolation enabled
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronApp", true);
