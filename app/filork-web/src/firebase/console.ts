import { ViewPlugin } from "@codemirror/view";
import {
  DatabaseReference,
  child,
  onChildAdded,
  onChildRemoved,
} from "firebase/database";

import {
  console,
  consoleState,
  consoleMessageEffect,
} from "@core/extensions/console/codemirror";

export function remoteConsole(session: DatabaseReference) {
  const consolePlugin = ViewPlugin.define((view) => {
    let consoleListeners: { [userKey: string]: () => void } = {};

    let addUserListener = onChildAdded(child(session.ref, "users"), (user) => {
      if (user.key === null)
        throw Error("User added callback returned root node");

      consoleListeners[user.key] = onChildAdded(
        child(user.ref, "console"),
        (message) => {
          view.dispatch({ effects: consoleMessageEffect.of(message.val()) });
        }
      );
    });

    let removeUserListener = onChildRemoved(
      child(session.ref, "users"),
      (user) => {
        if (user.key === null)
          throw Error("User removed callback returned root node");

        consoleListeners[user.key]();
        delete consoleListeners[user.key];
      }
    );

    return {
      destroy: () => {
        addUserListener();
        removeUserListener();

        for (let unlisten of Object.values(consoleListeners)) {
          unlisten();
        }
      },
    };
  });

  return [consolePlugin, consoleState, console()];
}
