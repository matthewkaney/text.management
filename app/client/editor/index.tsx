import { basicSetup, EditorState, EditorView } from "@codemirror/basic-setup";
import { haskell } from "@codemirror/legacy-modes/mode/haskell";
import { RangeSetBuilder } from "@codemirror/rangeset";
import { StreamLanguage } from "@codemirror/stream-parser";
import {
  Decoration,
  DecorationSet,
  KeyBinding,
  keymap,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { useCallback } from "react";
import { listenForOSC, sendOSC } from "../osc";
import { peerExtension } from "./peer";
import { oneDark } from "./theme";

let commands: KeyBinding[] = [
  {
    key: "Shift-Enter",
    run: ({ state: { doc, selection } }) => {
      if (selection.main.empty) {
        let { text, number } = doc.lineAt(selection.main.from);

        if (text.trim().length === 0) {
          // Do nothing
          return true;
        }

        let fromL, toL;
        fromL = toL = number;

        while (fromL > 1 && doc.line(fromL - 1).text.trim().length > 0) {
          fromL -= 1;
        }
        while (toL < doc.lines && doc.line(toL + 1).text.trim().length > 0) {
          toL += 1;
        }

        let { from } = doc.line(fromL);
        let { to } = doc.line(toL);
        text = doc.sliceString(from, to);
        return sendOSC("/tidal/code", text);
      } else {
        let { from, to } = selection.main;
        let text = doc.sliceString(from, to);
        return sendOSC("/tidal/code", text);
      }
    },
  },
];

const emptyLine = Decoration.line({
  attributes: { class: "cm-emptyLine" },
});

function emptyLineDeco(view: EditorView) {
  let builder = new RangeSetBuilder<Decoration>();
  for (let { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to; ) {
      let line = view.state.doc.lineAt(pos);
      if (line.text === "") builder.add(line.from, line.from, emptyLine);
      pos = line.to + 1;
    }
  }
  return builder.finish();
}

export function Editor() {
  const refCallback = useCallback((ref: HTMLElement | null) => {
    if (ref) {
      listenForOSC("/doc", ({ args: [version, doc] }) => {
        if (typeof version === "number" && typeof doc === "string") {
          new EditorView({
            state: EditorState.create({
              doc,
              extensions: [
                basicSetup,
                oneDark,
                StreamLanguage.define(haskell),
                keymap.of(commands),
                peerExtension(version),
                ViewPlugin.fromClass(
                  class {
                    decorations: DecorationSet;
                    constructor(view: EditorView) {
                      this.decorations = emptyLineDeco(view);
                    }
                    update(update: ViewUpdate) {
                      if (update.docChanged || update.viewportChanged)
                        this.decorations = emptyLineDeco(update.view);
                    }
                  },
                  {
                    decorations: (v) => v.decorations,
                  }
                ),
              ],
            }),
            parent: ref,
          });
        }
      });

      sendOSC("/doc/get");
    }
  }, []);

  return <section id="editor" ref={refCallback}></section>;
}
