import { Transaction, StateEffect, EditorSelection } from "@codemirror/state";

const remoteSelection = StateEffect.define<{ selection: EditorSelection }>();

export function currentSelection(tr: Transaction) {
  let { selection } = tr;
  return selection ? [remoteSelection.of({ selection })] : [];
}
