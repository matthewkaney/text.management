import { ViewPlugin } from "@codemirror/view";
import {
  ConsoleMessage,
  consoleState,
  sendToConsole,
  console as rootConsole,
} from "@management/cm-console";

import { TextManagementAPI } from "@core/api";

export function console(api: TextManagementAPI) {
  let initialConsole: ConsoleMessage[] = [];

  const consoleListener = ViewPlugin.define((view) => {
    const unlisten = api.listenForConsole((message) => {
      view.dispatch(sendToConsole(view.state, message));
    });

    return {
      destroy: () => {
        unlisten();
      },
    };
  });

  return [
    consoleState.init(() => initialConsole),
    consoleListener,
    rootConsole(),
  ];
}
