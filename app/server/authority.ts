import { ChangeSet, Text } from "@codemirror/state";
import { Update } from "@codemirror/collab";

import WebSocket from "ws";

import { message } from "../osc/osc";

// The updates received so far (updates.length gives the current
// version)
let updates: Update[] = [];

// The current document
let doc = Text.of(["Start document"]);

let pending: ((value: string[]) => void)[] = [];

export function getDocument(ws: WebSocket) {
  // Version, Document Contents
  ws.send(message("/doc", updates.length, doc.toString()));
}

export function pullUpdates(ws: WebSocket, version: number) {
  if (version < updates.length) {
    ws.send(
      message(
        "/doc/pull/done",
        ...updates.slice(version).map((u) => JSON.stringify(u))
      )
    );
  } else {
    pending.push((newUpdates: string[]) => {
      ws.send(message("/doc/pull/done", ...newUpdates));
    });
  }
}

export function pushUpdates(
  ws: WebSocket,
  version: number,
  ...newUpdates: string[]
) {
  if (version !== updates.length) {
    // respond with false
    ws.send(message("/doc/push/done", false));
  } else {
    for (let update of newUpdates.map((u) => JSON.parse(u))) {
      let changes = ChangeSet.fromJSON(update.changes);
      updates.push({ changes, clientID: update.clientID });
      doc = changes.apply(doc);
    }
    ws.send(message("/doc/push/done", true));
    // Notify pending requests
    while (pending.length) pending.pop()!(newUpdates);
  }
}
