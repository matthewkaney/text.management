import { DatabaseReference, child, push } from "firebase/database";
import { getSession, createSession } from "@core/extensions/firebase/session";

import { Editor } from "./editor";

window.addEventListener("load", () => {
  const parent = document.body.appendChild(document.createElement("section"));
  parent.id = "editor";

  let sessionID = window.location.pathname.slice(1);
  let session: DatabaseReference;

  if (sessionID) {
    session = getSession(sessionID);
  } else {
    session = createSession();
    push(child(session, "documents"), { start: { text: [""], version: 0 } });
    history.replaceState(null, "", session.key);
  }

  new Editor(session, parent);
});
