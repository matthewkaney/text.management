import { EditorView, KeyBinding } from "@codemirror/view";

import { commandEffect, evalEffect } from "./evaluate";

export const evalKeymap: KeyBinding[] = [
  { key: "Shift-Enter", run: evalSelection },
  { key: "Mod-Enter", run: evalSelection },
  { key: "Shift-Enter", run: evalLine },
  { key: "Mod-Enter", run: evalBlock },
  { key: "Mod-.", run: hush },
];

export function evalSelection({ state, dispatch }: EditorView) {
  if (state.selection.main.empty) return false;

  dispatch({ effects: evalEffect.of(state.selection.main) });
  return true;
}

export function evalLine({ state, dispatch }: EditorView) {
  const line = state.doc.lineAt(state.selection.main.from);
  dispatch({ effects: evalEffect.of(line) });
  return true;
}

export function evalBlock({ state, dispatch }: EditorView) {
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
  dispatch({ effects: commandEffect.of({ method: "hush" }) });
  return true;
}
