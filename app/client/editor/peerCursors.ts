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

import { WidgetType } from "@codemirror/view";

class CursorWidget extends WidgetType {
  toDOM() {
    let cursor = document.createElement("span");
    cursor.setAttribute("aria-hidden", "true");
    cursor.style.borderLeft = "2px solid #888";
    cursor.style.marginLeft = "-2px";
    return cursor;
  }
}

const Cursor = Decoration.widget({ widget: new CursorWidget(), side: 1 });

export const cursorPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = Decoration.set([]);
    }

    update(update: ViewUpdate) {
      if (update.docChanged) {
        if (update.view.state.doc.length > 5) {
          this.decorations = Decoration.set([
            Cursor.range(update.view.state.doc.length - 5),
          ]);
        } else {
          this.decorations = Decoration.set([]);
        }
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
