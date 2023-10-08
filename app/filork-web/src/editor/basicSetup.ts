import { lineNumbers, drawSelection } from "@codemirror/view";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
} from "@codemirror/language";

export const basicSetup = [
  lineNumbers(),
  drawSelection(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
];
