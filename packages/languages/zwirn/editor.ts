import { StreamLanguage } from "@codemirror/language";
import { haskell } from "@codemirror/legacy-modes/mode/haskell";

export function zwirn() {
  return [StreamLanguage.define(haskell)];
}
