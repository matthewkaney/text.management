import { keymap, KeyBinding } from "@codemirror/view";
import { EditorState, EditorView, basicSetup } from "@codemirror/basic-setup";
import { StreamLanguage } from "@codemirror/stream-parser";
import { haskell } from "@codemirror/legacy-modes/mode/haskell";

import { getMessages } from "../osc/osc";

import { oneDark } from "./theme";

let out: (name: string) => WebMidi.MIDIOutput | undefined = () => undefined;

if ("requestMIDIAccess" in navigator) {
  navigator.requestMIDIAccess().then((m) => {
    [...m.outputs.values()].forEach((o) => console.log(o.name));

    out = (n) => [...m.outputs.values()].find(({ name }) => name === n);
  });
}

let socket = new WebSocket("ws://localhost:4567/");
socket.binaryType = "arraybuffer";

socket.addEventListener("open", () => {
  socket.addEventListener("message", ({ data }) => {
    let bundle = getMessages(new Uint8Array(data));

    for (let { address, args, ntpTime } of bundle) {
      if (
        (address === "/tidal/reply" || address === "/tidal/error") &&
        typeof args[0] === "string"
      ) {
        const element = document.createElement("div");
        element.innerText = args[0];
        element.classList.add("item");
        document.getElementById("terminal-contents")?.appendChild(element);
        element.scrollIntoView(false);
      } else if (address === "/midi/play") {
        let params: { [k: string]: any } = {};

        while (args.length >= 2) {
          let key, val;
          [key, val, ...args] = args;

          if (typeof key === "string") {
            params[key] = val;
          }
        }

        console.log(params);

        if (typeof params.d === "string") {
          if (
            typeof params.delta === "number" &&
            typeof params.n === "number"
          ) {
            let delta = params.delta * 1000;
            let note = params.n + 60;
            let vel = typeof params.vel === "number" ? params.vel : 80;
            let chan = typeof params.chan === "number" ? params.chan : 0;

            let time = ntpTime ? ntpToTimestamp(...ntpTime) : performance.now();

            out(params.d)?.send([0x90 | chan, note, vel], time);
            out(params.d)?.send([0x80 | chan, note, 0], time + delta);
          }
        }
      }
    }
  });
});

function ntpToTimestamp(seconds: number, fracSeconds: number) {
  return (
    (seconds -
      2208988800 + // Seconds relative to unix epoch (1632406222)
      fracSeconds / 4294967296) * // Fractional seconds (1632406222.18567943572998047)
      1000 - // Converted to milliseconds (1632406222185.67943572998047)
    performance.timeOrigin // Adjust to current time origin (19351.679443359375)
  );
}

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

import { render } from "react-dom";

import { Editor } from "./Editor";
import { Terminal } from "./Terminal";

function App() {
  return (
    <>
      <Editor />
      <Terminal feed={[]} />
    </>
  );
}

window.addEventListener("load", () => {
  render(<App />, document.body);
});
