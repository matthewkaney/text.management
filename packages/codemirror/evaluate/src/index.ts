import { keymap } from "@codemirror/view";

import { evalActions, EvaluationHandler } from "./evaluate";
import { evalKeymap } from "./commands";
import { evalDecoration } from "./decoration";
import { evalTheme } from "./theme";

export * from "./evaluate";
export * from "./commands";
export { evalDecoration } from "./decoration";
export { evalTheme } from "./theme";

export function evaluation(action?: EvaluationHandler) {
  let extensions = [evalDecoration(), evalTheme, keymap.of(evalKeymap)];
  if (action) extensions.push(evalActions.of(action));
  return extensions;
}
