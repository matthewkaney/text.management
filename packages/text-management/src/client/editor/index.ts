import { indentWithTab } from "@codemirror/commands";
import { haskell } from "@codemirror/legacy-modes/mode/haskell";
import { StreamLanguage } from "@codemirror/language";
import { EditorView, keymap } from "@codemirror/view";
import { evaluation } from "@management/cm-evaluate";
import { basicSetup } from "./basicSetup";
import { oneDark } from "../../extensions/theme/theme";
import { decorateEmptyLines } from "./emptyLines";

import { stateFromDatabase } from "../firebase/editorState";
import { Session } from "../firebase/session";

export async function createEditor(
  session: Promise<Session>,
  parent: HTMLElement
) {
  let { ref } = await session;
  let state = await stateFromDatabase(ref, [
    keymap.of([indentWithTab]),
    evaluation(),
    basicSetup,
    oneDark,
    StreamLanguage.define(haskell),
  ]);

  new EditorView({ state, parent });
}
