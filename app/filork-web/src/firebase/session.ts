import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  push,
  get,
  set,
  DatabaseReference,
} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCCI6aaQue3ouM3xwhpnZN13NV1FVHOTr8",
  authDomain: "text-management-fc3da.firebaseapp.com",
  databaseURL: "https://text-management-fc3da-default-rtdb.firebaseio.com",
  projectId: "text-management-fc3da",
  storageBucket: "text-management-fc3da.appspot.com",
  messagingSenderId: "179979662724",
  appId: "1:179979662724:web:82926ad96e6ec667d499d1",
};

// Initialize Firebase
initializeApp(firebaseConfig);

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
