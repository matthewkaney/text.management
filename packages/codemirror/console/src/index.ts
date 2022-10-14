import { Extension } from "@codemirror/state";

import { consoleState } from "./state";
import { consolePanel } from "./panel";
import { consoleTheme } from "./theme";

export * from "./state";
export * from "./panel";
export * from "./theme";

export function console(): Extension {
  return [consoleState, consolePanel, consoleTheme];
}
