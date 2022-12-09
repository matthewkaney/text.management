import { EditorState, Extension, Text, ChangeSet } from "@codemirror/state";
import { get, DatabaseReference } from "firebase/database";
import { peer } from "../editor/peer";
import { getAPI } from "./api";

import { firebaseConsole } from "./console";

export async function stateFromDatabase(
  reference: DatabaseReference,
  extensions: Extension[] = []
) {
  let dataSnapshot = await get(reference);
  let data = dataSnapshot.val();
  let dbExtensions: Extension[] = [];

  // Get document information/versioning from database
  let { initial, versions = [] } = data;
  let doc = Text.of(initial.split("\n"));
  let startVersion = 0;
  for (let { changes } of versions) {
    doc = ChangeSet.fromJSON(JSON.parse(changes)).apply(doc);
    startVersion += 1;
  }
  dbExtensions.push(peer(getAPI(reference), startVersion));

  return EditorState.create({
    doc,
    extensions: [extensions, dbExtensions, firebaseConsole(dataSnapshot)],
  });
}
