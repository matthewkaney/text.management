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

import { firebaseCollab } from "../firebase/databasePeer";

let tidalCommands: KeyBinding[] = [
  {
    key: "Mod-.",
    run: () => {
      sendOSC("/tidal/code", "hush");
      return true;
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

import { Session, getSession, createSession } from "../firebase/session";
import { get } from "firebase/database";

let sessionRef: Promise<Session>;
let id = window.location.pathname.slice(1);

if (id) {
  sessionRef = getSession(id);
} else {
  sessionRef = createSession();

  sessionRef.then(({ id }) => {
    history.replaceState(null, "", id);
  });
}

export function Editor() {
  const refCallback = useCallback((ref: HTMLElement | null) => {
    if (ref) {
      sessionRef
        .then((session) => get(session.ref))
        .then((session) => {
          let { initial } = session.val();

          new EditorView({
            state: EditorState.create({
              doc: initial,
              extensions: [
                keymap.of([indentWithTab, ...tidalCommands]),
                evaluation(),
                basicSetup,
                oneDark,
                StreamLanguage.define(haskell),
                firebaseCollab(session.ref),
                // peerExtension(version),
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
