import { indentWithTab } from "@codemirror/commands";
import { EditorView, keymap } from "@codemirror/view";
import { evaluation } from "@management/cm-evaluate";
import { basicSetup } from "@core/extensions/basicSetup";
import { oneDark } from "@core/extensions/theme/theme";
import { tidal } from "@management/lang-tidal/editor";

import { EditorState, Text } from "@codemirror/state";

import { TextManagementAPI } from "@core/api";
import { console as electronConsole } from "@core/extensions/console";
import { peer } from "@core/extensions/peer";
import { toolbar } from "@core/extensions/toolbar";

import { app } from "@core/extensions/firebase/app";
import { session } from "@core/extensions/firebase/currentSession";
import { newSession } from "@core/extensions/firebase/session";
import { get } from "firebase/database";
import { FirebaseDocument } from "@core/extensions/firebase/api";

window.addEventListener("load", () => {
  const parent = document.body.appendChild(document.createElement("section"));
  parent.id = "editor";
  new Editor(parent);
});

export class Editor {
  constructor(parent: HTMLElement) {
    session
      .then((content) => (content ? content : newSession(app)))
      .then(async ({ id, ref }) => {
        let snapshot = await get(ref);
        let document: FirebaseDocument | undefined;

        if (snapshot.child("documents").hasChildren()) {
          snapshot.child("documents").forEach((child) => {
            document = FirebaseDocument.fromRemote(child);
            return true;
          });
        } else {
          document = new FirebaseDocument();
          document.pushToSession(ref);
        }

        if (document) {
          new EditorView({
            state: EditorState.create({
              doc: Text.of([""]),
              extensions: [
                tidal(),
                keymap.of([indentWithTab]),
                evaluation(),
                basicSetup,
                oneDark,
                // electronConsole(api),
                peer(document, 0),
                // @ts-ignore
                toolbar({ getTidalVersion: () => new Promise(() => {}) }),
              ],
            }),
            parent,
          });
        }
      });
  }
}
