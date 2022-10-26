import { child, DatabaseReference, onChildAdded, set } from "firebase/database";

import { ChangeSet } from "@codemirror/state";
import { EditorView, ViewUpdate, ViewPlugin } from "@codemirror/view";
import {
  collab,
  getSyncedVersion,
  sendableUpdates,
  receiveUpdates,
  getClientID,
} from "@codemirror/collab";

export function firebaseCollab(session: DatabaseReference) {
  let plugin = ViewPlugin.fromClass(
    class {
      session = session;

      constructor(private view: EditorView) {
        this.view = view;

        onChildAdded(child(this.session, "versions"), (version) => {
          let { changes, clientID } = version.val();
          changes = ChangeSet.fromJSON(JSON.parse(changes));

          this.view.dispatch(
            receiveUpdates(this.view.state, [{ changes, clientID }])
          );
        });
      }

      update(update: ViewUpdate) {
        if (update.docChanged || sendableUpdates(this.view.state).length) {
          queueMicrotask(() => this.push());
        }
      }

      push() {
        if (!this.session) return;
        if (!sendableUpdates(this.view.state).length) return;

        let [update] = sendableUpdates(this.view.state);
        let version = getSyncedVersion(this.view.state);
        set(child(this.session, `versions/${version}`), {
          changes: JSON.stringify(update.changes.toJSON()),
          clientID: getClientID(this.view.state),
        });
      }
    }
  );

  return [collab(), plugin];
}
