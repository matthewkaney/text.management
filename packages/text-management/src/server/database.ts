import { get, push, child, onChildAdded } from "firebase/database";
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
    session = await createSession(document.contents);
    console.log(`Created remote session: ${session.id}`);
  }

  repl.on("message", (m) => {
    push(child(session.ref, "console"), m);
  });

  onChildAdded(child(session.ref, "versions"), (version) => {
    let { changes, eval: evaluations } = version.val();
    document.update(ChangeSet.fromJSON(JSON.parse(changes)));

    if (evaluations) {
      for (let evaluation of evaluations as string[]) {
        let [from, to] = JSON.parse(evaluation) as [number, number];
        let code = document.slice(from, to);
        console.log("Evaluate:");
        console.log(code);
        repl.send(code);
      }
    }
  });
}