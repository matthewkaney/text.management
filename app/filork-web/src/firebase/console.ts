import { ViewPlugin } from "@codemirror/view";
import {
  DataSnapshot,
  child,
  query,
  onChildAdded,
  startAfter,
  orderByKey,
  Query,
} from "firebase/database";
import {
  ConsoleMessage,
  consoleState,
  sendToConsole,
  console,
  inaccessibleConsole,
} from "@management/cm-console";

export function firebaseConsole(data: DataSnapshot) {
  let { console: consoleData = {} } = data.val();
  let initialConsole: ConsoleMessage[] = [];
  let lastMessageKey: string | undefined;
  for (let messageKey in consoleData) {
    lastMessageKey = messageKey;
    if (consoleData[messageKey].level === "log")
      consoleData[messageKey].level = "info";
    initialConsole.push(consoleData[messageKey]);
  }

  let consoleQuery: Query;
  if (lastMessageKey) {
    consoleQuery = query(
      child(data.ref, "console"),
      orderByKey(),
      startAfter(lastMessageKey)
    );
  } else {
    consoleQuery = child(data.ref, "console");
  }

  const consoleListener = ViewPlugin.define((view) => {
    onChildAdded(consoleQuery, (messageSnapshot) => {
      let message = messageSnapshot.val();
      if (message.level === "log") message.level = "info";
      view.dispatch(sendToConsole(view.state, message));
    });

    return { destroy: () => {} };
  });

  return [
    inaccessibleConsole,
    consoleState.init(() => initialConsole),
    consoleListener,
    console(),
  ];
}
