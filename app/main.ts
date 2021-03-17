import {keymap, KeyBinding} from "@codemirror/view";
import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup";
import {StreamLanguage} from "@codemirror/stream-parser";
import {haskell} from "@codemirror/legacy-modes/mode/haskell";

import {oneDark} from "./theme";

let commands: KeyBinding[] = [
  {key: "Shift-Enter", run: () => { console.log("RUN SOMETHING!"); return true}}
];

window.addEventListener("load", () => {
  let editor = new EditorView({
    state: EditorState.create({
      extensions: [basicSetup, oneDark, StreamLanguage.define(haskell), keymap.of(commands)]
    }),
    parent: document.body
  })
});