import { DatabaseReference, child, push } from "firebase/database";
import { getSession, createSession } from "@core/extensions/firebase/session";

import { Editor } from "./editor";
import { getUserProfile } from "@core/extensions/firebase/user";

window.addEventListener("load", () => {
  const parent = document.body.appendChild(document.createElement("section"));
  parent.id = "editor";

  let [_, sessionID, isAll] = window.location.pathname.split("/");
  let session: DatabaseReference;

  // TODO: Pass this down in a better form than a global variable
  // @ts-ignore
  window.showAllMessages = isAll === "all";

  if (sessionID) {
    session = getSession(sessionID);
  } else {
    session = createSession();
    push(child(session, "documents"), { start: { text: [""], version: 0 } });
    history.replaceState(null, "", session.key);
  }

  let user = getUserProfile(session);

  new Editor(session, user, parent);
});
