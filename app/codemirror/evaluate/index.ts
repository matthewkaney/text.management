import { keymap } from "@codemirror/view";
import { Extension } from "@codemirror/state";

import { evaluationFlash } from "./highlight";
import { evaluationTheme } from "./theme";
import { evaluationKeymap } from "./commands";

export function evaluation(): Extension {
  return [evaluationFlash(), evaluationTheme, keymap.of(evaluationKeymap)];
}
