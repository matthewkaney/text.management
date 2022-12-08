// preload with contextIsolation enabled
import { contextBridge } from "electron";
import { api } from "./api";

contextBridge.exposeInMainWorld("electronApp", true);

// GHCI functions
contextBridge.exposeInMainWorld("api", api);
