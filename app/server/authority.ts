import { ChangeSet, Text } from "@codemirror/state";
import { Update } from "@codemirror/collab";

import WebSocket from "ws";

import { message } from "../osc/osc";

// The updates received so far (updates.length gives the current
// version)
let updates: Update[] = [];

// The current document
let doc = Text.of([""]);

let pending: ((value: string[]) => void)[] = [];

import { readFile, writeFile } from "fs/promises";

export class Document {
  private path: string | undefined;
  private doc: Promise<Text>;

  private writing = false;
  private debounceTimer?: number | string | NodeJS.Timeout;

  constructor(path?: string) {
    this.path = path;
    this.doc = this.loadDocument(path);
  }

  private async loadDocument(path?: string) {
    if (path) {
      try {
        return Text.of([await readFile(path, { encoding: "utf-8" })]);
      } catch (err) {
        if (err.code === "ENOENT") {
          return Text.of([""]);
        } else {
          throw err;
        }
      }
    } else {
      return Text.of([""]);
    }
  }

  get contents() {
    return this.doc.then((doc) => doc.toString());
  }

  update(changes: ChangeSet) {
    this.doc = this.doc.then((doc) => changes.apply(doc));

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }

    this.debounceTimer = setTimeout(async () => {
      this.debounceTimer = undefined;

      if (!this.writing) {
      }
    }, 1000);
  }

  private save() {
    if (this.writing) {
    } else {
      this.writing = true;
    }

    async function write(path: string) {
      /*while (this.writeRequest) {
        this.writeRequest = false;
        await writeFile(this.path, await this.doc);
      }*/
    }
  }
}

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
