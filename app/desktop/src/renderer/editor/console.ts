import { ViewPlugin } from "@codemirror/view";
import {
  ConsoleMessage,
  consoleState,
  sendToConsole,
  console,
} from "@management/cm-console";

import { TextManagementAPI } from "../../../../../packages/text-management/src/api";

export function electronConsole(api: TextManagementAPI) {
  let initialConsole: ConsoleMessage[] = [];

  const consoleListener = ViewPlugin.define((view) => {
    window.console.log(api);
    window.console.log(typeof api.listenForConsole);
    const unlisten = api.listenForConsole((message) => {
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
