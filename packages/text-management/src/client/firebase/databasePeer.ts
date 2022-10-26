import { child, DatabaseReference, onChildAdded, set } from "firebase/database";

import { ChangeSet, Transaction } from "@codemirror/state";
import { EditorView, ViewUpdate, ViewPlugin } from "@codemirror/view";
import {
  collab,
  getSyncedVersion,
  sendableUpdates,
  receiveUpdates,
  getClientID,
} from "@codemirror/collab";
import { evalEffect } from "@management/cm-evaluate";

export function firebaseCollab(session: DatabaseReference) {
  let plugin = ViewPlugin.fromClass(
    class {
      session = session;

      constructor(private view: EditorView) {
        this.view = view;

        onChildAdded(child(this.session, "versions"), (version) => {
          let { changes, clientID, eval: effects } = version.val();
          changes = ChangeSet.fromJSON(JSON.parse(changes));

          if (effects) {
            effects = (effects as string[])
              .map((e) => JSON.parse(e) as [number, number])
              .map(([from, to]) => evalEffect.of({ from, to }));
          }

          this.view.dispatch(
            receiveUpdates(this.view.state, [{ changes, clientID, effects }])
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
          clientID: getClientID(this.view.state),
          changes: JSON.stringify(update.changes.toJSON()),
          eval: update.effects
            ?.filter((e) => e.is(evalEffect))
            .map(({ value: { from, to } }) => JSON.stringify([from, to])),
        });
      }
    }
  );

  return [collab({ sharedEffects: evals }), plugin];
}

function evals(tr: Transaction) {
  return tr.effects.filter((e) => e.is(evalEffect));
}
