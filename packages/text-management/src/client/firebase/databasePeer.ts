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

import { Session, getSession, createSession } from "./session";

let sessionRef: Promise<Session>;
let id = window.location.pathname.slice(1);

if (id) {
  sessionRef = getSession(id);
} else {
  sessionRef = createSession();

  sessionRef.then(({ id }) => {
    history.replaceState(null, "", id);
  });
}

export function firebaseCollab() {
  let plugin = ViewPlugin.fromClass(
    class {
      session?: DatabaseReference;

      constructor(private view: EditorView) {
        this.view = view;

        sessionRef.then((session) => {
          this.session = session.ref;

          onChildAdded(child(this.session, "versions"), (version) => {
            let { changes, clientID } = version.val();
            changes = ChangeSet.fromJSON(JSON.parse(changes));

            this.view.dispatch(
              receiveUpdates(this.view.state, [{ changes, clientID }])
            );
          });
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
