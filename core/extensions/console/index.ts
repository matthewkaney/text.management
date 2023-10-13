import { keymap, ViewPlugin } from "@codemirror/view";
import {
  consoleState,
  sendToConsole,
  clearConsole,
  console as rootConsole,
  ConsoleMessage,
} from "@management/cm-console";

import { ElectronAPI, TerminalMessage, Evaluation } from "@core/api";

export function console(
  api: typeof ElectronAPI,
  initial: (TerminalMessage | Evaluation)[]
) {
  const consoleListener = ViewPlugin.define((view) => {
    const unlisten = api.onConsoleMessage((message) => {
      view.dispatch(sendToConsole(view.state, format(message)));
    });

    return {
      destroy: () => {
        unlisten();
      },
    };
  });

  return [
    consoleState.init(() => initial.map((m) => format(m))),
    consoleListener,
    rootConsole(),
    keymap.of([{ key: "Mod-`", run: clearConsole }]),
  ];
}

function format(message: TerminalMessage | Evaluation): ConsoleMessage {
  if ("level" in message) {
    return message;
  } else {
    let { input, success, result } = message;
    return {
      level: success ? "info" : "error",
      source: "Tidal",
      text: `> ${input}${typeof result === "string" ? `\n\n${result}` : ""}`,
    };
  }
}
