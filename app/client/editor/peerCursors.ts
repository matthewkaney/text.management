import { Transaction, StateEffect, EditorSelection } from "@codemirror/state";
import {
  ViewPlugin,
  DecorationSet,
  EditorView,
  ViewUpdate,
  Decoration,
} from "@codemirror/view";

const remoteSelection = StateEffect.define<{ selection: EditorSelection }>();

export function currentSelection(tr: Transaction) {
  let { selection } = tr;
  return selection ? [remoteSelection.of({ selection })] : [];
}
