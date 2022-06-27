import { basicSetup, EditorView } from "codemirror";
import { EditorState, RangeSetBuilder } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import {
  Decoration,
  DecorationSet,
  keymap,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { evaluation } from "@management/cm-evaluate";
import { useCallback } from "react";
import { listenForOSC, sendOSC } from "../osc";
import { peerExtension } from "./peer";
import { oneDark } from "./theme";

import { extensions as hydra } from "../../../packages/languages/hydra/dist/editor";

console.log(hydra);

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

interface EditorProps {
  onEval: (code: string) => void;
}

export function Editor({ onEval }: EditorProps) {
  const refCallback = useCallback((ref: HTMLElement | null) => {
    if (ref) {
      listenForOSC("/doc", ({ args: [version, doc] }) => {
        if (typeof version === "number" && typeof doc === "string") {
          new EditorView({
            state: EditorState.create({
              doc,
              extensions: [
                hydra,
                keymap.of([indentWithTab]),
                evaluation((c) => onEval(c)),
                basicSetup,
                oneDark,
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
