import { ChangeSet, Text } from "@codemirror/state";
import { Update } from "@codemirror/collab";

import WebSocket from "ws";

import { message } from "../osc/osc";

// The updates received so far (updates.length gives the current
// version)
let updates: Update[] = [];

let pending: ((value: string[]) => void)[] = [];

import { readFile, writeFile } from "fs/promises";

export class Document {
  private path: string | undefined;
  private doc: Promise<Text>;

  private autosaveTime = 1000;

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

  private autosaveTimer?: number | string | NodeJS.Timeout;

  update(changes: ChangeSet) {
    this.doc = this.doc.then((doc) => changes.apply(doc));

    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
      this.autosaveTimer = undefined;
    }

    this.autosaveTimer = setTimeout(async () => {
      this.autosaveTimer = undefined;
      this.save();
    }, this.autosaveTime);
  }

  private writing = false;
  private writeRequest = false;

  private save() {
    const write = async () => {
      while (this.path && this.writeRequest) {
        this.writing = true;
        this.writeRequest = false;
        await writeFile(this.path, (await this.doc).toString());
        this.writing = false;
      }
    };

    if (this.writing) {
      this.writeRequest = true;
    } else {
      this.writeRequest = true;
      write();
    }
  }
}

export async function getDocument(doc: Document, ws: WebSocket) {
  // Version, Document Contents
  ws.send(message("/doc", updates.length, (await doc.contents).toString()));
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
  doc: Document,
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
      doc.update(changes);
    }
    ws.send(message("/doc/push/done", true));
    // Notify pending requests
    while (pending.length) pending.pop()!(newUpdates);
  }
}
