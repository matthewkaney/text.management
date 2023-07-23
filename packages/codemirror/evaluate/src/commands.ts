import { EditorView, KeyBinding } from "@codemirror/view";

import { evalEffect, evalActions } from "./evaluate";

export const evalKeymap: KeyBinding[] = [
  { key: "Shift-Enter", run: evalLine },
  { key: "Mod-Enter", run: evalBlock },
  { key: "Mod-.", run: hush },
];

export function evalLine({ state, dispatch }: EditorView) {
  if (state.facet(evalActions).length === 0) return false;

  const line = state.doc.lineAt(state.selection.main.from);
  dispatch({ effects: evalEffect.of(line) });
  return true;
}

export function evalBlock({ state, dispatch }: EditorView) {
  if (state.facet(evalActions).length === 0) return false;

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

  dispatch({ effects: evalEffect.of({ from, to }) });
  return true;
}

export function hush({ dispatch }: EditorView) {
  dispatch({ effects: evalEffect.of({ code: "hush" }) });
  return true;
}
