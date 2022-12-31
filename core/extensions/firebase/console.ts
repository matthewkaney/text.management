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
} from "@management/cm-console";

export function firebaseConsole(data: DataSnapshot) {
  let { console: consoleData = {} } = data.val();
  let initialConsole: ConsoleMessage[] = [];
  let lastMessageKey: string | undefined;
  for (let messageKey in consoleData) {
    lastMessageKey = messageKey;
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
    onChildAdded(consoleQuery, (message) => {
      view.dispatch(sendToConsole(view.state, message.val()));
    });

    return { destroy: () => {} };
  });

  return [consoleState.init(() => initialConsole), consoleListener, console()];
}
