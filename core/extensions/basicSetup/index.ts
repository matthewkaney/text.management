import {
  lineNumbers,
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
import { decorateEmptyLines } from "./emptyLines";
import { tabFocus } from "./tabTrapping";
import { searchKeymap } from "@codemirror/search";

export const basicSetup = [
  keymap.of(searchKeymap),
  // lineNumbers(),
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
