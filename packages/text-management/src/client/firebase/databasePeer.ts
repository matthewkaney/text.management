import "./app";
import {
  getDatabase,
  ref,
  push,
  child,
  onChildAdded,
  runTransaction,
} from "firebase/database";

import { EditorView, ViewUpdate, ViewPlugin } from "@codemirror/view";
import {
  collab,
  getSyncedVersion,
  sendableUpdates,
  receiveUpdates,
} from "@codemirror/collab";
import { version } from "process";

console.log("Do database stuff...");
const db = getDatabase();
const sessionListRef = ref(db, "sessions");
const sessionRef = push(sessionListRef, { initial: "", versions: {} });
console.log(sessionRef);

export function firebaseCollab(startVersion: number) {
  let plugin = ViewPlugin.fromClass(
    class {
      private pushing = false;
      private done = false;

      constructor(private view: EditorView) {
        this.view = view;

        onChildAdded(child(sessionRef, "versions"), (version) => {
          if (version.val()) {
          }
        });
      }

      update(update: ViewUpdate) {
        console.log(getSyncedVersion(this.view.state));
        //if (update.docChanged) this.push();
      }

      push() {
        let updates = sendableUpdates(this.view.state);
        if (updates.length === 0) return;

        for (let update of updates) {
          push(child(sessionRef, "versions"), {
            changes: update.changes.toJSON(),
          });
        }

        // runTransaction(child(sessionRef, "versions"), (versions) => {
        //   console.log("Run transaction...");
        //   let updates = sendableUpdates(this.view.state);
        // });
        /*let updates = sendableUpdates(this.view.state);
        if (!updates.length) return;

        let version = getSyncedVersion(this.view.state);
        if (this.pushing || !updates.length) return;
        this.pushing = true;
        let version = getSyncedVersion(this.view.state);
        await pushUpdates(version, updates);
        this.pushing = false;
        // Regardless of whether the push failed or new updates came in
        // while it was running, try again if there's updates remaining
        if (sendableUpdates(this.view.state).length)
          setTimeout(() => this.push(), 100);*/
      }

      /*async pull() {
        while (!this.done) {
          let version = getSyncedVersion(this.view.state);
          let updates = await pullUpdates(version);
          this.view.dispatch(receiveUpdates(this.view.state, updates));
        }
      }

      destroy() {
        this.done = true;
      }*/
    }
  );
  return [collab({ startVersion }), plugin];
}
