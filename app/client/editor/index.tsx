import { useCallback } from "react";

import { keymap, KeyBinding } from "@codemirror/view";
import { EditorState, EditorView, basicSetup } from "@codemirror/basic-setup";
import { StreamLanguage } from "@codemirror/stream-parser";
import { haskell } from "@codemirror/legacy-modes/mode/haskell";

import { oneDark } from "./theme";

import { sendOSC } from "../osc";

let commands: KeyBinding[] = [
  {
    key: "Shift-Enter",
    run: ({ state }) => {
      let { from } = state.selection.main;
      let { text } = state.doc.lineAt(from);
      return sendOSC("/tidal/code", text);
    },
  },
];

export function Editor() {
  const refCallback = useCallback((ref: HTMLElement | null) => {
    if (ref) {
      new EditorView({
        state: EditorState.create({
          extensions: [
            basicSetup,
            oneDark,
            StreamLanguage.define(haskell),
            keymap.of(commands),
          ],
        }),
        parent: ref,
      });
    }
  }, []);

  return <section id="editor" ref={refCallback}></section>;
}
