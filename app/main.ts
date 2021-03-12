import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup"
import {StreamLanguage} from "@codemirror/stream-parser"
import {haskell} from "@codemirror/legacy-modes/mode/haskell"

import {oneDark} from "./theme";

window.addEventListener("load", () => {
  let editor = new EditorView({
    state: EditorState.create({
      extensions: [basicSetup, oneDark, StreamLanguage.define(haskell)]
    }),
    parent: document.body
  })
});