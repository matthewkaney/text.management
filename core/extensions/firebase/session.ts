import { FirebaseApp } from "firebase/app";

import {
  getDatabase,
  ref as dbRef,
  get,
  set,
  DatabaseReference,
} from "firebase/database";

export interface Session {
  id: string;
  ref: DatabaseReference;
}

export async function newSession(app: FirebaseApp) {
  let db = getDatabase(app);
  let session: Session | undefined;

  while (!session) {
    try {
      let id = `${randomChars(4)}-${randomChars(4)}`;
      let ref = dbRef(db, `sessions/${id}`);
      await set(ref, { documents: {}, users: {} });
      session = { id, ref };
    } catch (e) {
      // Do something
    }
  }

  return session;
}

export async function getSession(app: FirebaseApp, id: string) {
  let ref = dbRef(getDatabase(app), `sessions/${id}`);

  try {
    // Try loading remote session
    await get(ref);
    let session: Session = { id, ref };
    return session;
  } catch (e) {
    // If remote session isn't found
    return null;
  }
}

function randomChars(length: number) {
  return Math.random()
    .toString(36)
    .slice(2, 2 + length);
}
