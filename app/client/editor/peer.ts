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
import { sendOSC, sendOSCWithResponse, listenForOSC } from "../osc";

import { currentSelection } from "./peerCursors";

async function pushUpdates(
  version: number,
  fullUpdates: readonly Update[]
): Promise<boolean> {
  // Strip off transaction data
  let updates = fullUpdates.map((u) =>
    JSON.stringify({
      clientID: u.clientID,
      changes: u.changes,
    })
  );
  let msg = await sendOSCWithResponse(
    ["/doc/push", version, ...updates],
    "/doc/push/done"
  );

  if (typeof msg.args[0] === "boolean") {
    return msg.args[0];
  } else {
    return false;
  }
}

async function pullUpdates(version: number): Promise<readonly Update[]> {
  let { args } = await sendOSCWithResponse(
    ["/doc/pull", version],
    "/doc/pull/done"
  );

  return (args as string[]).map((arg) => {
    let u = JSON.parse(arg);
    return { changes: ChangeSet.fromJSON(u.changes), clientID: u.clientID };
  });
}

export function peerExtension(startVersion: number) {
  let plugin = ViewPlugin.fromClass(
    class {
      private pushing = false;
      private done = false;

      constructor(private view: EditorView) {
        this.pull();
      }

      update(update: ViewUpdate) {
        if (update.docChanged) this.push();
      }

      async push() {
        let updates = sendableUpdates(this.view.state);
        if (this.pushing || !updates.length) return;
        this.pushing = true;
        let version = getSyncedVersion(this.view.state);
        await pushUpdates(version, updates);
        this.pushing = false;
        // Regardless of whether the push failed or new updates came in
        // while it was running, try again if there's updates remaining
        if (sendableUpdates(this.view.state).length)
          setTimeout(() => this.push(), 100);
      }

      async pull() {
        while (!this.done) {
          let version = getSyncedVersion(this.view.state);
          let updates = await pullUpdates(version);
          this.view.dispatch(receiveUpdates(this.view.state, updates));
        }
      }

      destroy() {
        this.done = true;
      }
    }
  );
  return [
    collab({ startVersion, sharedEffects: currentSelection }),
    plugin,
    CursorField,
    cursorDecorations,
    peerCursor,
  ];
}

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
  update: (value, { changes, effects }) =>
    value.map(changes).update({
      add: effects
        .filter((e) => e.is(SetCursorEffect))
        .map((e) => {
          let { id, from, to } = e.value;
          return new PeerCursor(id).range(from, to);
        }),
      sort: true,
      filter: (_from, _to, value) =>
        effects.some((e) => e.is(RemoveCursorEffect) && e.value === value.id),
    }),
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
