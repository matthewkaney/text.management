import { EditorState, Extension, Text, ChangeSet } from "@codemirror/state";
import { DataSnapshot } from "firebase/database";

import { peer } from "./peer";

export function stateFromDatabase(
  snapshot: DataSnapshot,
  extensions: Extension[] = []
) {
  let data = snapshot.val();

  // Get document information/versioning from database
  let {
    start: { text, version },
    updates = [],
  } = data;
  let doc = Text.of(text);
  for (let { changes } of updates.slice(version)) {
    doc = ChangeSet.fromJSON(JSON.parse(changes)).apply(doc);
  }

  return EditorState.create({
    doc,
    extensions: [extensions, peer(snapshot)],
  });
}
