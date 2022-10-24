import "./app";
import { getDatabase, ref, push, set, runTransaction } from "firebase/database";

import { EditorView, ViewUpdate, ViewPlugin } from "@codemirror/view";

console.log("Do database stuff...");
const db = getDatabase();
const postListRef = ref(db, "sessions");
const newPostRef = push(postListRef);
console.log(newPostRef);
set(newPostRef, "Hi...");

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

      push() {
        runTransaction((updates) => {
          let updates = sendableUpdates();
        });
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
  return [collab({ startVersion }), plugin];
}
