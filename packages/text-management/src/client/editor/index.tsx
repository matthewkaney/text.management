import { RangeSetBuilder } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { haskell } from "@codemirror/legacy-modes/mode/haskell";
import { StreamLanguage } from "@codemirror/language";
import {
  EditorView,
  Decoration,
  DecorationSet,
  keymap,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { evaluation } from "@management/cm-evaluate";
import { useCallback } from "react";
import { basicSetup } from "./basicSetup";
import { oneDark } from "./theme";

import { get } from "firebase/database";
import { session } from "../currentSession";
import { stateFromDatabase } from "../firebase/editorState";
import { decorateEmptyLines } from "./emptyLines";

export function Editor() {
  const refCallback = useCallback((parent: HTMLElement | null) => {
    if (parent) {
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
  }, []);

  return <section id="editor" ref={refCallback}></section>;
}
