#!/usr/bin/env node

import { program } from "commander";

import { createSession, getSession } from "@core/extensions/firebase/session";

import { GHCI } from "@management/lang-tidal";

import { Text, ChangeSet } from "@codemirror/state";

import {
  push,
  child,
  onChildAdded,
  query,
  startAt,
  set,
  onDisconnect,
  DatabaseReference,
} from "firebase/database";

import { toTerminalMessage } from "@core/extensions/console/types";

// Set up commands
program.option("-r, --remote <session id>");

program.parse();

const options = program.opts();

let session: DatabaseReference;

if (options.remote) {
  session = getSession(options.remote);
  console.log(`Joining session: ${session.key}`);
} else {
  session = createSession();
  console.log(`Session created: ${session.key}`);
  let result = push(child(session, "documents"), {
    start: { text: [""], version: 0 },
  });
}

// Set up user info
let user = push(child(session, "users"), {
  readonly: true,
  engine: { tidal: { version: null } },
});

onDisconnect(user).remove();

// TODO: This is kind of a hack that skips the desktop app settings process
// by just passing in an empty path that's assumed not to resolve
const tidal = new GHCI("");

// Update version
tidal.getVersion().then((version) => {
  set(child(user, "engine/tidal/version"), version);
});

tidal.on("message", (message) => {
  push(child(user, "console"), toTerminalMessage(message, "Tidal"));
});

// Pull one document
onChildAdded(
  child(session, "documents"),
  (document) => {
    let data = document.val();

    // Get document information/versioning from database
    let {
      start: { text, version },
      updates = [],
    } = data;
    let doc = Text.of(text);
    for (let { changes } of updates.slice(version)) {
      doc = ChangeSet.fromJSON(JSON.parse(changes)).apply(doc);
    }

    onChildAdded(
      query(
        child(document.ref, "updates"),
        startAt(undefined, updates.length.toString())
      ),
      async (update) => {
        if (update.key === null)
          throw Error("Update handler called on root document");

        let { changes, clientID, eval: evaluations = [] } = update.val();

        // Update doc
        doc = ChangeSet.fromJSON(JSON.parse(changes)).apply(doc);

        for (let evaluationJson of evaluations) {
          let evaluation = JSON.parse(evaluationJson);
          let code: string;

          if (typeof evaluation === "string") {
            code = evaluation;
          } else {
            let [from, to] = evaluation;
            code = doc.sliceString(from, to);
          }

          for await (let evaluation of tidal.send(code)) {
            push(child(user, "console"), {
              ...toTerminalMessage(evaluation, "Tidal"),
              clientID,
            });
          }
        }
      }
    );
  },
  {
    onlyOnce: true,
  }
);