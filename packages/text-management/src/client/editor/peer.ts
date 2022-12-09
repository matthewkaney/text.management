import { StateEffect, Transaction, ChangeSet } from "@codemirror/state";
import { EditorView, ViewUpdate, ViewPlugin } from "@codemirror/view";
import {
  collab,
  getSyncedVersion,
  sendableUpdates,
  receiveUpdates,
  getClientID,
  Update,
} from "@codemirror/collab";
import { commandEffect, evalEffect } from "@management/cm-evaluate";
import { TextManagementAPI } from "../../api";

export function peer(api: TextManagementAPI, startVersion: number) {
  let plugin = ViewPlugin.fromClass(
    class {
      constructor(private view: EditorView) {
        this.view = view;

        api.onUpdate(startVersion, (update) => {
          let { version, clientID, changes, evaluations } = update;

          changes = ChangeSet.fromJSON(changes);

          // Ignore local updates
          if (clientID === getClientID(this.view.state)) return;

          let effects: StateEffect<any>[] = [];

          if (evaluations) {
            effects = (evaluations as any[])
              .filter((args) => typeof args[0] === "number")
              .map(([from, to]) => evalEffect.of({ from, to }));
          }

          this.applyUpdate(version, {
            changes,
            clientID,
            effects,
          });
        });
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
        let version = getSyncedVersion(this.view.state);
        let update = updates[0];
        let { changes, clientID, effects } = update;

        let evaluations: ([number, number] | [string])[] | undefined = effects
          ?.filter((e) => e.is(evalEffect) || e.is(commandEffect))
          .map((e) =>
            e.is(evalEffect) ? [e.value.from, e.value.to] : [e.value.method]
          );

        let success = await api.pushUpdate({
          version,
          changes: changes.toJSON(),
          clientID,
          evaluations,
        });

        this.pushing = false;
        if (success) {
          this.applyUpdate(version, update);
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
  return tr.effects.filter((e) => e.is(evalEffect) || e.is(commandEffect));
}
