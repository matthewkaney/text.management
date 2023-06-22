import { keymap, ViewPlugin } from "@codemirror/view";
import {
  ConsoleMessage,
  consoleState,
  sendToConsole,
  clearConsole,
  console as rootConsole,
} from "@management/cm-console";

import { ElectronAPI } from "@core/api";

export function console(api: typeof ElectronAPI, initial: ConsoleMessage[]) {
  const consoleListener = ViewPlugin.define((view) => {
    const unlisten = api.onConsoleMessage((message) => {
      view.dispatch(sendToConsole(view.state, message));
    });

    return {
      destroy: () => {
        unlisten();
      },
    };
  });

  return [
    consoleState.init(() => [...initial]),
    consoleListener,
    rootConsole(),
    keymap.of([{ key: "Escape", run: clearConsole }]),
  ];
}
