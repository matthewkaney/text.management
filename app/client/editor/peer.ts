import {
  Update,
  receiveUpdates,
  sendableUpdates,
  collab,
  getSyncedVersion,
  getClientID,
} from "@codemirror/collab";
import { ChangeSet, SelectionRange } from "@codemirror/state";
import { EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { sendOSC, sendOSCWithResponse } from "../osc";

import { currentSelection, cursorPlugin } from "./peerCursors";

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
    peerCursor,
    cursorPlugin,
  ];
}

const peerCursor = ViewPlugin.fromClass(
  class {
    constructor(private view: EditorView) {
      console.log("Constructor");
      console.log(getClientID(view.state));
      let { from, to } = view.state.selection.main;
      sendOSC("/cursor/push", getClientID(view.state), from, to);
      console.log(view.state.selection.main);
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

    destroy() {}
  }
);
