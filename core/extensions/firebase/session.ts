import { initializeApp } from "firebase/app";
import { getDatabase, ref } from "firebase/database";

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

export function getSession(id: string) {
  return ref(db, `sessions/${id}`);
}

export function createSession() {
  let id = `${randomChars(4)}-${randomChars(4)}`;

  // TODO: Check that the generated ID isn't already used...

  return ref(db, `sessions/${id}`);
}

function randomChars(length: number) {
  return Math.random()
    .toString(36)
    .slice(2, 2 + length);
}
