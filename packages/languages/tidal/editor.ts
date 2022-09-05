import { KeyBinding, keymap } from "@codemirror/view";
import { StreamLanguage } from "@codemirror/stream-parser";
import { haskell } from "@codemirror/legacy-modes/mode/haskell";

let tidalCommands: KeyBinding[] = [
  {
    key: "Mod-.",
    run: () => {
      //sendOSC("/tidal/code", "hush");
      return true;
    },
  },
];

export const extension = [
  keymap.of(tidalCommands),
  StreamLanguage.define(haskell),
];
