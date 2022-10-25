import "./app";
import {
  getDatabase,
  ref,
  push,
  child,
  onChildAdded,
  set,
  DatabaseReference,
} from "firebase/database";

import { ChangeSet } from "@codemirror/state";
import { EditorView, ViewUpdate, ViewPlugin } from "@codemirror/view";
import {
  collab,
  getSyncedVersion,
  sendableUpdates,
  receiveUpdates,
  getClientID,
} from "@codemirror/collab";

const db = getDatabase();
const sessionListRef = ref(db, "sessions");

let sessionRef: DatabaseReference;

if (window.location.pathname === "/") {
  sessionRef = push(sessionListRef, {
    initial: "",
    versions: [],
  });
} else {
  sessionRef = child(sessionListRef, window.location.pathname.slice(1));
}

history.replaceState(null, "", sessionRef.key);

export function firebaseCollab(startVersion: number) {
  let plugin = ViewPlugin.fromClass(
    class {
      constructor(private view: EditorView) {
        this.view = view;

        onChildAdded(child(sessionRef, "versions"), (version) => {
          console.log("Child added...");
          console.log(version);

          let { changes, clientID } = version.val();

          console.log(clientID);

          this.view.dispatch(
            receiveUpdates(this.view.state, [
              { changes: ChangeSet.fromJSON(changes), clientID: clientID },
            ])
          );
        });
      }

      update(update: ViewUpdate) {
        if (update.docChanged || sendableUpdates(this.view.state).length) {
          queueMicrotask(() => this.push());
        }
      }

      push() {
        if (!sendableUpdates(this.view.state).length) return;

        let [update] = sendableUpdates(this.view.state);
        let version = getSyncedVersion(this.view.state);
        set(child(sessionRef, `versions/${version}`), {
          changes: update.changes.toJSON(),
          clientID: getClientID(this.view.state),
        });
      }
    }
  );

  return [collab({ startVersion }), plugin];
}
