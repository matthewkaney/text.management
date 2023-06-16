import { LanguageMode } from "@core/extensions/language/editor";

import { StreamLanguage } from "@codemirror/language";
import { haskell } from "@codemirror/legacy-modes/mode/haskell";
import { indentation } from "./indentation";

export default LanguageMode.define("Tidal", [
  indentation(),
  StreamLanguage.define(haskell),
]);
