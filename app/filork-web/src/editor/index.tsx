import { indentWithTab } from "@codemirror/commands";
import { haskell } from "@codemirror/legacy-modes/mode/haskell";
import { StreamLanguage } from "@codemirror/language";
import { EditorView, keymap } from "@codemirror/view";
import { evaluation } from "@management/cm-evaluate";
import { basicSetup } from "./basicSetup";
import { oneDark } from "./theme";

import { get } from "firebase/database";
import { stateFromDatabase } from "../firebase/editorState";
import { Session } from "../firebase/session";

export class Editor {
  constructor(session: Promise<Session>, parent: HTMLElement) {
    session
      .then((s) => get(s.ref))
      .then((s) => {
        const state = stateFromDatabase(s, [
          keymap.of([indentWithTab]),
          evaluation(),
          basicSetup,
          oneDark,
          StreamLanguage.define(haskell),
        ]);

        new EditorView({ state, parent });
      });
  }
}
