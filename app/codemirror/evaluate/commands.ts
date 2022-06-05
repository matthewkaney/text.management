import { EditorView, KeyBinding } from "@codemirror/view";

import { evaluate } from "./highlight";

export function evaluateSelection({ state, dispatch }: EditorView) {
  if (state.selection.main.empty) return false;

  dispatch({ effects: evaluate.of(state.selection.main) });
  return true;
}

export function evaluateLine({ state, dispatch }: EditorView) {
  const line = state.doc.lineAt(state.selection.main.from);
  dispatch({ effects: evaluate.of(line) });
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

  dispatch({ effects: evaluate.of({ from, to }) });
  return true;
}

export const evaluationKeymap: KeyBinding[] = [
  { key: "Shift-Enter", run: evaluateSelection },
  { key: "Mod-Enter", run: evaluateSelection },
  { key: "Shift-Enter", run: evaluateLine },
  { key: "Mod-Enter", run: evaluateBlock },
];
