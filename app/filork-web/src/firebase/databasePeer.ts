import {
  child,
  DatabaseReference,
  DataSnapshot,
  onChildAdded,
  onChildChanged,
  query,
  set,
  startAt,
} from "firebase/database";

import { ChangeSet, Transaction, StateEffect } from "@codemirror/state";
import { EditorView, ViewUpdate, ViewPlugin } from "@codemirror/view";
import {
  collab,
  getSyncedVersion,
  sendableUpdates,
  receiveUpdates,
  getClientID,
  Update,
} from "@codemirror/collab";
import { evaluationEffect, Evaluation } from "@management/cm-evaluate";

export function firebaseCollab(
  session: DatabaseReference,
  startVersion: number
) {
  let plugin = ViewPlugin.fromClass(
    class {
      session = session;

      constructor(private view: EditorView) {
        this.view = view;

        const onRemoteUpdate = (version: DataSnapshot) => {
          let { changes, clientID, eval: effects } = version.val();

          // Ignore local updates
          if (clientID === getClientID(this.view.state)) return;

          changes = ChangeSet.fromJSON(JSON.parse(changes));

          if (effects) {
            effects = (effects as string[])
              .map((e) => JSON.parse(e) as any[])
              .filter((args) => typeof args[0] === "number")
              .map(([from, to]) =>
                evaluationEffect.of(
                  new Evaluation(view.state.sliceDoc(from, to), { from, to })
                )
              );
          }

          if (version.key !== null) {
            this.applyUpdate(parseInt(version.key), {
              changes,
              clientID,
              effects,
            });
          }
        };

        let versionQuery = query(
          child(this.session, "versions"),
          startAt(undefined, startVersion.toString())
        );
        onChildAdded(versionQuery, onRemoteUpdate);
        onChildChanged(versionQuery, onRemoteUpdate);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || sendableUpdates(this.view.state).length) {
          this.push();
        }
      }

      private pushing = false;

      private async push() {
        let updates = sendableUpdates(this.view.state);
        if (this.pushing || !updates.length) return;

        this.pushing = true;
        let update = updates[0];
        let version = getSyncedVersion(this.view.state);

        let evaluations = update.effects
          ?.filter((e) => e.is(evaluationEffect))
          .map((e) =>
            "span" in e.value
              ? JSON.stringify([e.value.span.from, e.value.span.to])
              : JSON.stringify([e.value.code])
          );

        try {
          await set(child(this.session, `versions/${version}`), {
            clientID: getClientID(this.view.state),
            changes: JSON.stringify(update.changes.toJSON()),
            eval: evaluations,
          });

          this.pushing = false;
          this.applyUpdate(version, update);
        } catch (e) {
          // TODO: Catch errors other than permission denied?
          this.pushing = false;
        }
      }

      private queuedUpdates: Map<number, Update> = new Map();

      private applyUpdate(version: number, update: Update) {
        this.queuedUpdates.set(version, update);

        let next: Update | undefined;
        let nextVersion = getSyncedVersion(this.view.state);

        while ((next = this.queuedUpdates.get(nextVersion))) {
          this.view.dispatch(receiveUpdates(this.view.state, [next]));
          nextVersion = getSyncedVersion(this.view.state);
        }
      }
    }
  );

  return [collab({ startVersion, sharedEffects: evals }), plugin];
}

function evals(tr: Transaction) {
  return tr.effects.filter((e) => e.is(evaluationEffect));
}
