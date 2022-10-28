import { Session, getSession, createSession } from "./firebase/session";

let sessionRef: Promise<Session>;
let id = window.location.pathname.slice(1);

if (id) {
  sessionRef = getSession(id);
} else {
  sessionRef = createSession();

  sessionRef.then(({ id }) => {
    history.replaceState(null, "", id);
  });
}

export const session = sessionRef;
