import {
  Update,
  receiveUpdates,
  sendableUpdates,
  collab,
  getSyncedVersion,
  getClientID,
} from "@codemirror/collab";

import {
  ChangeSet,
  SelectionRange,
  StateField,
  StateEffect,
  Range,
  RangeSet,
  RangeValue,
} from "@codemirror/state";

import {
  Decoration,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";

class PeerCursor extends RangeValue {
  id: string;

  constructor(id: string) {
    super();
    this.id = id;
  }

  eq(other: PeerCursor) {
    return this.id === other.id;
  }
}

const SetCursorEffect = StateEffect.define<{
  id: string;
  from: number;
  to: number;
}>();
const RemoveCursorEffect = StateEffect.define<string>();

export const CursorField = StateField.define<RangeSet<PeerCursor>>({
  create: () => {
    return RangeSet.empty;
  },
  update: (value, { changes, effects }) => {
    return value.map(changes).update({
      add: effects
        .filter((e) => e.is(SetCursorEffect))
        .map((e) => {
          let { id, from, to } = e.value;
          return new PeerCursor(id).range(from, to);
        }),
      sort: true,
      filter: (_from, _to, value) =>
        !effects.some(
          (e) =>
            (e.is(SetCursorEffect) && e.value.id === value.id) ||
            (e.is(RemoveCursorEffect) && e.value === value.id)
        ),
    });
  },
});

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

const cursorDecorations = EditorView.decorations.from(
  CursorField,
  (cursors) => {
    let cursorDecs: Range<Decoration>[] = [];
    let itr = cursors.iter();
    while (itr.value) {
      cursorDecs.push(Cursor.range(itr.from));
      itr.next();
    }
    return Decoration.set(cursorDecs);
  }
);

const peerCursor = ViewPlugin.fromClass(
  class {
    private unloadListener;

    constructor(private view: EditorView) {
      this.unloadListener = listenForOSC("/cursor/push", ({ args }) => {
        let [id, from, to] = args;

        if (
          typeof id === "string" &&
          typeof from === "number" &&
          typeof to === "number"
        ) {
          view.dispatch({ effects: [SetCursorEffect.of({ id, from, to })] });
        }
      });

      let { from, to } = view.state.selection.main;
      sendOSC("/cursor/push", getClientID(view.state), from, to);
    }

    update(update: ViewUpdate) {
      if (update.selectionSet) {
        let selection: SelectionRange | null = null;

        for (let tr of update.transactions) {
          if (tr.selection) {
            selection = tr.selection.main;
          }

          if (selection) {
            let { from, to } = selection;
            sendOSC("/cursor/push", getClientID(update.startState), from, to);
          }
        }
      }
    }

    destroy() {
      this.unloadListener();
    }
  }
);
