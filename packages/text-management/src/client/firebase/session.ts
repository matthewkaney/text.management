import "./app";

import {
  getDatabase,
  ref,
  push,
  get,
  set,
  DatabaseReference,
} from "firebase/database";

const db = getDatabase();
const sessionListRef = ref(db, "sessions");

export interface Session {
  id: string;
  ref: DatabaseReference;
}

export async function getSession(id: string): Promise<Session> {
  let session: DatabaseReference;

  let longID = await get(ref(db, `sessionIds/${id}`));

  if (longID.exists()) {
    session = ref(db, `sessions/${longID.val()}`);
  } else {
    session = push(sessionListRef);
  }

  return { id, ref: session };
}

export async function createSession(initial = "") {
  let session: DatabaseReference;
  session = push(sessionListRef, { initial });

  let id = `${randomChars(4)}-${randomChars(4)}`;
  await set(ref(db, `sessionIds/${id}`), session.key);

  return { id, ref: session };
}

function randomChars(length: number) {
  return Math.random()
    .toString(36)
    .slice(2, 2 + length);
}
