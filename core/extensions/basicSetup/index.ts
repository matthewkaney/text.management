import {
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
} from "@codemirror/view";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
} from "@codemirror/language";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";

import { lineNumbers } from "./settings";
import { decorateEmptyLines } from "./emptyLines";
import { tabFocus } from "./tabTrapping";
import { Config } from "@core/state";

export function basicSetup(configuration: Config) {
  return [
    lineNumbers(configuration),
    drawSelection(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    bracketMatching(),
    closeBrackets(),
    history(),
    keymap.of([...defaultKeymap, ...closeBracketsKeymap, ...historyKeymap]),
    decorateEmptyLines(),
    tabFocus,
  ];
}
