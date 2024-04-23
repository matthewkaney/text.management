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
import { getClientID } from "@codemirror/collab";

type WindowWithMessageFlag = Window &
  typeof globalThis & { showAllMessages: boolean };

export function remoteConsole(session: DatabaseReference) {
  const consolePlugin = ViewPlugin.define((view) => {
    let consoleListeners: { [userKey: string]: () => void } = {};
    let activeListener: string | null = null;

    let addUserListener = onChildAdded(child(session.ref, "users"), (user) => {
      if (user.key === null)
        throw Error("User added callback returned root node");

      if (activeListener === null) {
        activeListener = user.key;
      }

      consoleListeners[user.key] = onChildAdded(
        child(user.ref, "console"),
        (messageSnapshot) => {
          let message = messageSnapshot.val();
          if (
            user.key === activeListener &&
            (message.clientID === getClientID(view.state) ||
              (window as WindowWithMessageFlag).showAllMessages)
          ) {
            view.dispatch({ effects: consoleMessageEffect.of(message) });
          }
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

        if (activeListener === user.key) {
          activeListener = Object.keys(consoleListeners)[0] || null;
        }
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
