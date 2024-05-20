import { EditorView, KeyBinding } from "@codemirror/view";

import { evaluate } from "./evaluate";

export const evaluationKeymap: KeyBinding[] = [
  { key: "Shift-Enter", run: evaluateLine },
  { key: "Mod-Enter", run: evaluateBlock },
  { key: "Mod-.", run: hush },
];

export function evaluateLine({ state, dispatch }: EditorView) {
  const line = state.doc.lineAt(state.selection.main.from);
  dispatch(evaluate(state, line.from, line.to));
  return true;
}

export function evaluateBlock({ state, dispatch }: EditorView) {
  let { doc, selection } = state;
  let { text, number } = state.doc.lineAt(selection.main.from);

  if (text.trim().length === 0) return true;

  let fromL, toL;
  fromL = toL = number;

  while (fromL > 1 && doc.line(fromL - 1).text.trim().length > 0) {
    fromL -= 1;
  }
  while (toL < doc.lines && doc.line(toL + 1).text.trim().length > 0) {
    toL += 1;
  }

  let { from } = doc.line(fromL);
  let { to } = doc.line(toL);

  dispatch(evaluate(state, from, to));
  return true;
}

export function hush({ state, dispatch }: EditorView) {
  dispatch(evaluate(state, "hush"));
  return true;
}
