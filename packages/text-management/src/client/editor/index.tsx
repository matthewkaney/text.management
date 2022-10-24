import { EditorState, RangeSetBuilder } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { haskell } from "@codemirror/legacy-modes/mode/haskell";
import { StreamLanguage } from "@codemirror/language";
import {
  EditorView,
  Decoration,
  DecorationSet,
  KeyBinding,
  keymap,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { evaluation } from "@management/cm-evaluate";
import { useCallback } from "react";
import { basicSetup } from "./basicSetup";
import { listenForOSC, sendOSC } from "../osc";
import { peerExtension } from "./peer";
import { oneDark } from "./theme";

import "../firebase/databasePeer";

let tidalCommands: KeyBinding[] = [
  {
    key: "Mod-.",
    run: () => {
      return sendOSC("/tidal/code", "hush");
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

function sendCode(code: string) {
  sendOSC("/tidal/code", code);
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
                keymap.of([indentWithTab, ...tidalCommands]),
                evaluation(sendCode),
                basicSetup,
                oneDark,
                StreamLanguage.define(haskell),
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
