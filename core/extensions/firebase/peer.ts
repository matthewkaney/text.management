import { StateEffect, Transaction, ChangeSet } from "@codemirror/state";
import { ViewUpdate, ViewPlugin } from "@codemirror/view";
import {
  collab,
  getSyncedVersion,
  sendableUpdates,
  receiveUpdates,
  getClientID,
  Update,
} from "@codemirror/collab";
import { commandEffect, evalEffect } from "@management/cm-evaluate";
import { DocumentUpdate } from "@core/api";

import { remoteCursors } from "../cursors/remoteCursors";

import {
  DatabaseReference,
  DataSnapshot,
  child,
  set,
  query,
  startAt,
  onChildAdded,
  onChildChanged,
} from "firebase/database";

export function peer(doc: DataSnapshot, user: DatabaseReference) {
  const { updates } = doc.val();
  const startVersion = Array.isArray(updates) ? updates.length : 0;

  let plugin = ViewPlugin.define((view) => {
    const offUpdate = onUpdate(doc, (update) => {
      let { version, clientID, changes, evaluations } = update;

      changes = ChangeSet.fromJSON(changes);

      // Ignore local updates
      if (clientID === getClientID(view.state)) return;

      let effects: StateEffect<any>[] = [];

      if (evaluations) {
        effects = (evaluations as any[])
          .filter((args) => typeof args[0] === "number")
          .map(([from, to]) => evalEffect.of({ from, to }));
      }

      applyUpdate(version, {
        changes,
        clientID,
        effects,
      });
    });

    let pushing = false;

    async function push() {
      let updates = sendableUpdates(view.state);
      if (pushing || !updates.length) return;

      pushing = true;
      let version = getSyncedVersion(view.state);
      let update = updates[0];
      let { changes, clientID, effects } = update;

      let evaluations: ([number, number] | [string])[] | undefined = effects
        ?.filter((e) => e.is(evalEffect) || e.is(commandEffect))
        .map((e) =>
          e.is(evalEffect) ? [e.value.from, e.value.to] : [e.value.method]
        );

      let success = await pushUpdate(doc.ref, {
        version,
        changes: changes.toJSON(),
        clientID,
        evaluations,
      });

      pushing = false;
      if (success) {
        applyUpdate(version, update);
      }
    }

    const queuedUpdates: Map<number, Update> = new Map();

    function applyUpdate(version: number, update: Update) {
      queuedUpdates.set(version, update);

      let next: Update | undefined;
      let nextVersion = getSyncedVersion(view.state);

      while ((next = queuedUpdates.get(nextVersion))) {
        view.dispatch(receiveUpdates(view.state, [next]));
        nextVersion = getSyncedVersion(view.state);
      }
    }

    return {
      update(update: ViewUpdate) {
        if (update.docChanged || sendableUpdates(update.view.state).length) {
          push();
        }
      },
      destroy() {
        offUpdate();
      },
    };
  });

  let clientID = user.key ?? undefined;

  return [
    collab({ startVersion, clientID, sharedEffects: evals }),
    plugin,
    remoteCursors(user),
  ];
}

function evals(tr: Transaction) {
  return tr.effects.filter((e) => e.is(evalEffect) || e.is(commandEffect));
}

/**
 * @param docRef A reference to the document to be updated
 * @param update The document update to be pushed
 * @returns A promise indicating whether the push was successful
 */
async function pushUpdate(docRef: DatabaseReference, update: DocumentUpdate) {
  let { version, clientID, changes, evaluations } = update;

  let evalStrings: string[] | undefined;
  if (evaluations) {
    evalStrings = evaluations.map((v) => JSON.stringify(v));
  }

  try {
    await set(child(docRef, `updates/${version}`), {
      clientID,
      changes: JSON.stringify(changes),
      eval: evalStrings,
    });

    return true;
  } catch (e) {
    // TODO: Catch errors other than permission denied?
    return false;
  }
}

type RemoteUpdateHandler = (update: DocumentUpdate) => void;

function onUpdate(doc: DataSnapshot, callback: RemoteUpdateHandler) {
  const { updates } = doc.val();
  const startVersion = Array.isArray(updates) ? updates.length : 0;

  const onRemoteUpdate = (snapshot: DataSnapshot) => {
    let { changes, clientID, eval: evaluations } = snapshot.val();

    changes = JSON.parse(changes);

    if (evaluations) {
      evaluations = (evaluations as string[]).map((e) => JSON.parse(e));
    }

    if (snapshot.key !== null) {
      callback({
        version: parseInt(snapshot.key),
        clientID,
        changes,
        evaluations,
      });
    }
  };

  let versionQuery = query(
    child(doc.ref, "updates"),
    startAt(undefined, startVersion.toString())
  );

  let unsubChildAdded = onChildAdded(versionQuery, onRemoteUpdate);
  let unsubChildChanged = onChildChanged(versionQuery, onRemoteUpdate);

  return () => {
    unsubChildAdded();
    unsubChildChanged();
  };
}
