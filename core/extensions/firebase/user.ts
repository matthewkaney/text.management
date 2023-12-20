import {
  DatabaseReference,
  push,
  child,
  onDisconnect,
} from "firebase/database";

export function getUserProfile(session: DatabaseReference, settings: any = {}) {
  let user = push(child(session, "users"), settings);

  onDisconnect(user).remove();

  return user;
}
