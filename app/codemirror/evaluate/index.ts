import { keymap } from "@codemirror/view";
import { Extension } from "@codemirror/state";

import { evaluationFlash } from "./highlight";
import { evaluationTheme } from "./theme";
import { evaluationKeymap } from "./commands";
import { evalHandler } from "./evaluation";

export function evaluation(action: (code: string) => void): Extension {
  return [
    evaluationFlash(),
    evaluationTheme,
    keymap.of(evaluationKeymap),
    evalHandler(action),
  ];
}
