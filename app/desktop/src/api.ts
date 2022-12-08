import { ipcRenderer, IpcRendererEvent } from "electron";
import { TerminalMessage } from "../../../packages/text-management/src/server/ghci";

export const api = {
  listenForConsole: (callback: (message: TerminalMessage) => void) => {
    const wrappedCallback = (_: IpcRendererEvent, message: TerminalMessage) => {
      callback(message);
    };

    ipcRenderer.on("console-message", wrappedCallback);

    return () => {
      ipcRenderer.off("console-message", wrappedCallback);
    };
  },
};
