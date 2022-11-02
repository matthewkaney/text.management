import { RangeSetBuilder } from "@codemirror/state";
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
import { basicSetup } from "./basicSetup";
import { oneDark } from "./theme";

import { get } from "firebase/database";
import { stateFromDatabase } from "../firebase/editorState";
import { Session } from "../firebase/session";

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

export class Editor {
  constructor(session: Promise<Session>, parent: HTMLElement) {
    session
      .then((s) => get(s.ref))
      .then((s) => {
        const state = stateFromDatabase(s, [
          keymap.of([indentWithTab]),
          evaluation(),
          basicSetup,
          oneDark,
          StreamLanguage.define(haskell),
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
        ]);

        new EditorView({ state, parent });
      });
  }
}
