import { keymap } from "@codemirror/view";
import { Extension } from "@codemirror/state";

import { evalAction, evalHandler } from "./evaluate";
import { evalKeymap } from "./commands";
import { evalDecoration } from "./decoration";
import { evalTheme } from "./theme";

export * from "./evaluate";
export * from "./commands";
export { evalDecoration } from "./decoration";
export { evalTheme } from "./theme";

export function evaluation(action?: evalHandler): Extension {
  let extensions = [evalDecoration(), evalTheme, keymap.of(evalKeymap)];
  if (action) extensions.push(evalAction(action));
  return extensions;
}
