import { ViewPlugin } from "@codemirror/view";
import {
  ConsoleMessage,
  consoleState,
  sendToConsole,
  console,
} from "@management/cm-console";

export function electronConsole() {
  let initialConsole: ConsoleMessage[] = [];

  const consoleListener = ViewPlugin.define((view) => {
    const unlisten = window.api.listenForConsole((message) => {
      view.dispatch(sendToConsole(view.state, message));
    });

    return {
      destroy: () => {
        unlisten();
      },
    };
  });

  return [consoleState.init(() => initialConsole), consoleListener, console()];
}
