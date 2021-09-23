import { keymap, KeyBinding } from "@codemirror/view";
import { EditorState, EditorView, basicSetup } from "@codemirror/basic-setup";
import { StreamLanguage } from "@codemirror/stream-parser";
import { haskell } from "@codemirror/legacy-modes/mode/haskell";

import { getMessages } from "../osc/osc";

import { oneDark } from "./theme";

let socket = new WebSocket("ws://localhost:4567/");
socket.binaryType = "arraybuffer";

socket.addEventListener("open", () => {
  socket.addEventListener("message", ({ data }) => {
    let bundle = getMessages(new Uint8Array(data));

    for (let { address, args } of bundle) {
      if (
        (address === "/tidal/reply" || address === "/tidal/error") &&
        typeof args[0] === "string"
      ) {
        const element = document.createElement("div");
        element.innerText = args[0];
        element.classList.add("item");
        document.getElementById("terminal-contents")?.appendChild(element);
        element.scrollIntoView(false);
      } else if (address === "/dirt/play") {
        let params: { [k: string]: any } = {};

        while (args.length >= 2) {
          let key, val;
          [key, val, ...args] = args;

          if (typeof key === "string") {
            params[key] = val;
          }
        }

        if (typeof params.delta === "number" && typeof params.n === "number") {
          let delta = params.delta;
          let note = params.n + 60;
          let vel = typeof params.vel === "number" ? params.vel : 80;
          let chan = typeof params.chan === "number" ? params.chan : 0;

          // sendMIDI(noteOn(chan, note, vel), time);
          // sendMIDI(noteOff(chan, note, 0), time + delta);
        }
      }
    }
  });
});

let commands: KeyBinding[] = [
  {
    key: "Shift-Enter",
    run: ({ state, dispatch }) => {
      if (socket.readyState === WebSocket.OPEN) {
        let { from } = state.selection.main;
        socket.send(state.doc.lineAt(from).text);
        return true;
      } else {
        return false;
      }
    },
  },
];

window.addEventListener("load", () => {
  let editor = new EditorView({
    state: EditorState.create({
      extensions: [
        basicSetup,
        oneDark,
        StreamLanguage.define(haskell),
        keymap.of(commands),
      ],
    }),
    parent: document.getElementById("editor") ?? undefined,
  });
});
