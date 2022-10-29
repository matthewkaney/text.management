import {
  ChangeSet,
  EditorState,
  RangeSetBuilder,
  Text,
} from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { haskell } from "@codemirror/legacy-modes/mode/haskell";
import { StreamLanguage } from "@codemirror/language";
import {
  EditorView,
  Decoration,
  DecorationSet,
  keymap,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { evaluation } from "@management/cm-evaluate";
import { useCallback } from "react";
import { basicSetup } from "./basicSetup";
import { oneDark } from "./theme";

import { firebaseCollab } from "../firebase/databasePeer";
import { get } from "firebase/database";
import { session } from "../currentSession";

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
      session
        .then((s) => get(s.ref))
        .then((s) => {
          let { initial, versions = [] } = s.val();

          let doc = Text.of(initial.split("\n"));
          let startVersion = 0;
          for (let { changes } of versions) {
            doc = ChangeSet.fromJSON(JSON.parse(changes)).apply(doc);
            startVersion += 1;
          }

          new EditorView({
            state: EditorState.create({
              doc,
              extensions: [
                keymap.of([indentWithTab]),
                evaluation(),
                basicSetup,
                oneDark,
                StreamLanguage.define(haskell),
                firebaseCollab(s.ref, startVersion),
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
        });
    }
  }, []);

  return <section id="editor" ref={refCallback}></section>;
}
