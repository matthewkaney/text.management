import { indentWithTab } from "@codemirror/commands";
import { haskell } from "@codemirror/legacy-modes/mode/haskell";
import { StreamLanguage } from "@codemirror/language";
import { EditorView, keymap } from "@codemirror/view";
import { evaluation } from "@management/cm-evaluate";
import { basicSetup } from "./basicSetup";
import { oneDark } from "@core/extensions/theme/theme";

import { DatabaseReference, child, onChildAdded } from "firebase/database";
import { stateFromDatabase } from "@core/extensions/firebase/editorState";
import { remoteConsole } from "../firebase/console";

export class Editor {
  constructor(
    session: DatabaseReference,
    user: DatabaseReference,
    parent: HTMLElement
  ) {
    onChildAdded(
      child(session, "documents"),
      (document) => {
        const state = stateFromDatabase(document, user, [
          keymap.of([indentWithTab]),
          evaluation(),
          basicSetup,
          oneDark,
          StreamLanguage.define(haskell),
          remoteConsole(session),
        ]);
        new EditorView({ state, parent });
      },
      {
        onlyOnce: true,
      }
    );
  }
}
