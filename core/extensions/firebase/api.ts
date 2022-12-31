import {
  set,
  child,
  query,
  startAt,
  onChildAdded,
  onChildChanged,
  DatabaseReference,
  DataSnapshot,
} from "firebase/database";

import { TextManagementAPI } from "../../api";

// Firebase implementation of Text.Management API
export function getAPI(session: DatabaseReference): TextManagementAPI {
  return {
    pushUpdate: (update) => {
      return new Promise(async (resolve) => {
        let { version, clientID, changes, evaluations } = update;

        let evalStrings: string[] | undefined;
        if (evaluations) {
          evalStrings = evaluations.map((v) => JSON.stringify(v));
        }

        try {
          await set(child(session, `versions/${version}`), {
            clientID,
            changes: JSON.stringify(changes),
            eval: evalStrings,
          });

          resolve(true);
        } catch (e) {
          // TODO: Catch errors other than permission denied?
          resolve(false);
        }
      });
    },

    onUpdate: (version, callback) => {
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
        child(session, "versions"),
        startAt(undefined, version.toString())
      );

      let unsubChildAdded = onChildAdded(versionQuery, onRemoteUpdate);
      let unsubChildChanged = onChildChanged(versionQuery, onRemoteUpdate);

      return () => {
        unsubChildAdded();
        unsubChildChanged();
      };
    },

    listenForConsole: (callback) => {
      return () => {};
    },
  };
}
