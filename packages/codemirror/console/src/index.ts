import { Extension } from "@codemirror/state";

import { consoleState } from "./state";
import { consolePanel } from "./panel";

export * from "./state";
export * from "./panel";

export function console(): Extension {
  return [consoleState, consolePanel];
}
