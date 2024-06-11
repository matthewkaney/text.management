import { ElectronAPI } from "@core/api";

import { StreamLanguage } from "@codemirror/language";
import { haskell } from "@codemirror/legacy-modes/mode/haskell";
import { indentation } from "./indentation";
import { evaluationWithHighlights, highlighter } from "./highlights";

export function tidal(api: typeof ElectronAPI) {
  return [
    indentation(),
    StreamLanguage.define(haskell),
    evaluationWithHighlights(api.evaluate),
    highlighter(api),
  ];
}
