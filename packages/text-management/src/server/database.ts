import { get, child, onChildAdded } from "firebase/database";
import { ChangeSet } from "@codemirror/state";

import { createSession, getSession, Session } from "../client/firebase/session";

import { Document } from "./authority";
import { GHCI } from "./ghci";

export async function startReplClient(
  id: string | undefined,
  document: Document,
  repl: GHCI
) {
  let session: Session;

  if (id) {
    session = await getSession(id);
    let initial = await get(child(session.ref, "initial"));
    document.replace(initial.val());
  } else {
    session = await createSession(await document.contents);
    console.log(`Created remote session: ${session.id}`);
  }

  onChildAdded(child(session.ref, "versions"), (version) => {
    let { changes } = version.val();
    document.update(ChangeSet.fromJSON(JSON.parse(changes)));
  });
}
