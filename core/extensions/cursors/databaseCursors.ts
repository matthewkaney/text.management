import { getClientID } from "@codemirror/collab";
import { ViewPlugin } from "@codemirror/view";

import { DataSnapshot, child, set } from "firebase/database";

export function firebaseCursors(data: DataSnapshot) {
  const cursorWatcher = ViewPlugin.define((view) => {
    console.log(getClientID(view.state));

    let localCursorRef = child(data.ref, `users/${getClientID(view.state)}`);

    set(localCursorRef, { position: view.state.selection.toJSON() });

    return {
      update: (update) => {
        if (update.selectionSet) {
          set(localCursorRef, { position: update.state.selection.toJSON() });
        }
      },
    };
  });

  return [cursorWatcher];
}

interface Cursor {
  position: { main: number; ranges: { anchor: number; head: number }[] };
}
