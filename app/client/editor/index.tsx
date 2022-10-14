import { basicSetup, EditorView } from "codemirror";
import { EditorState, RangeSetBuilder } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { haskell } from "@codemirror/legacy-modes/mode/haskell";
import { StreamLanguage } from "@codemirror/language";
import {
  Decoration,
  DecorationSet,
  KeyBinding,
  keymap,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { evaluation } from "@management/cm-evaluate";
import { console } from "@management/cm-console";
import { useCallback } from "react";
import { listenForOSC, sendOSC } from "../osc";
import { peerExtension } from "./peer";
import { oneDark } from "./theme";
import { consoleMessageEffect } from "@management/cm-console/src";

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

const consoleListener = ViewPlugin.define((view) => {
  let unlistenReply = listenForOSC("/tidal/reply", ({ args: [text] }) => {
    if (typeof text === "string") {
      window.console.log(text);
      view.dispatch({
        effects: [
          consoleMessageEffect.of({ level: "info", source: "Tidal", text }),
        ],
      });
    }
  });

  let unlistenError = listenForOSC("/tidal/error", ({ args: [text] }) => {
    if (typeof text === "string") {
      view.dispatch({
        effects: [
          consoleMessageEffect.of({ level: "error", source: "Tidal", text }),
        ],
      });
    }
  });

  return {
    destroy() {
      unlistenReply();
      unlistenError();
    },
  };
});

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
                console(),
                consoleListener,
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
