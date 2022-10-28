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
import { commandEffect, evalEffect } from "@management/cm-evaluate";

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
              .map((e) => JSON.parse(e) as any[])
              .filter((args) => typeof args[0] === "number")
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

        let evaluations = update.effects
          ?.filter((e) => e.is(evalEffect) || e.is(commandEffect))
          .map((e) =>
            e.is(evalEffect)
              ? JSON.stringify([e.value.from, e.value.to])
              : JSON.stringify([e.value.method])
          );

        set(child(this.session, `versions/${version}`), {
          clientID: getClientID(this.view.state),
          changes: JSON.stringify(update.changes.toJSON()),
          eval: evaluations,
        });
      }
    }
  );

  return [collab({ sharedEffects: evals }), plugin];
}

function evals(tr: Transaction) {
  return tr.effects.filter((e) => e.is(evalEffect) || e.is(commandEffect));
}
