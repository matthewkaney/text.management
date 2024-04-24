import { EditorSelection } from "@codemirror/state";
import { ViewPlugin } from "@codemirror/view";

import { DatabaseReference, child, set, onChildAdded } from "firebase/database";

export function remoteCursors(user: DatabaseReference) {
  const localCursor = ViewPlugin.define((view) => {
    let localCursorRef = child(user, "selection");

    set(localCursorRef, view.state.selection.toJSON());

    return {
      update: (update) => {
        if (update.selectionSet) {
          set(localCursorRef, update.state.selection.toJSON());
        }
      },
    };
  });

  const remoteCursors = ViewPlugin.define((view) => {
    if (user === null || user.parent === null)
      throw Error("Cursor tracking set up with invalid user.");

    const offChildAdded = onChildAdded(user.parent, (userSnapshot) => {
      if (user.isEqual(userSnapshot.ref)) return;

      let remoteUserData = userSnapshot.val();

      if ("snapshot" in remoteUserData) {
        let selection = EditorSelection.fromJSON(remoteUserData.selection);

        // Dispatch "remote user selection" event...
      }
    });

    return {
      destroy: () => {},
    };
  });

  return [localCursor];
}

interface Cursor {
  position: { main: number; ranges: { anchor: number; head: number }[] };
}
