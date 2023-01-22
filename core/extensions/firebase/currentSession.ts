import { app } from "./app";
import { Session, newSession, getSession } from "./session";

let sessionRef: Promise<Session | null>;
let id: string;
if ((window as Window & { electronApp?: boolean }).electronApp) {
  id = "";
} else {
  id = window.location.pathname.slice(1);
}

if (id) {
  sessionRef = getSession(app, id);
} else {
  sessionRef = newSession(app);

  sessionRef.then((session) => {
    if (!session) return;

    history.replaceState(null, "", session.id);
  });
}

export const session = sessionRef;
