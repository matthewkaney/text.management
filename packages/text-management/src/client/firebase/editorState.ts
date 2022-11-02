import { EditorState, Extension, Text, ChangeSet } from "@codemirror/state";
import { DataSnapshot } from "firebase/database";
import { firebaseCollab } from "./databasePeer";

export function stateFromDatabase(
  dataSnapshot: DataSnapshot,
  extensions: Extension[] = []
) {
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
  dbExtensions.push(firebaseCollab(dataSnapshot.ref, startVersion));

  return EditorState.create({
    doc,
    extensions: [extensions, dbExtensions],
  });
}
