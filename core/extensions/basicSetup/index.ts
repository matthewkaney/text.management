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
import { search, searchKeymap } from "@codemirror/search";
import { decorateEmptyLines } from "./emptyLines";
import { tabFocus } from "./tabTrapping";

export const basicSetup = [
  // lineNumbers(),
  drawSelection(),
  highlightActiveLine(),
  highlightActiveLineGutter(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  history(),
  search({ top: true }),
  keymap.of([...defaultKeymap, ...closeBracketsKeymap, ...historyKeymap, ...searchKeymap]),
  decorateEmptyLines(),
  tabFocus,
];
