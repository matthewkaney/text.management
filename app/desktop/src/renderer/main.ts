import { indentWithTab } from "@codemirror/commands";
import { EditorView, keymap } from "@codemirror/view";
import { evaluation } from "@management/cm-evaluate";
import { basicSetup } from "@core/extensions/basicSetup";
import { oneDark } from "@core/extensions/theme/theme";
import { tidal } from "@management/lang-tidal/editor";

import { EditorState } from "@codemirror/state";

import { console as electronConsole } from "@core/extensions/console";
import { peer } from "@core/extensions/peer";
import { toolbar } from "@core/extensions/toolbar";

import { api } from "./api";

window.addEventListener("load", () => {
  const parent = document.body.appendChild(document.createElement("section"));
  parent.id = "editor";
  new Editor(parent);
});

export class Editor {
  constructor(parent: HTMLElement) {
    let editor: EditorView | undefined;

    api.on("open", ({ doc }) => {
      console.log("THING OPENED!");
      document.title = doc.name$.value;

      if (editor) {
        editor.destroy();
      }

      doc.snapshot.then((snapshot) => {
        let { initialText, initialVersion } = snapshot;

        editor = new EditorView({
          state: EditorState.create({
            doc: initialText,
            extensions: [
              tidal(),
              keymap.of([indentWithTab]),
              evaluation(),
              basicSetup,
              oneDark,
              electronConsole(api),
              peer(doc, initialVersion),
              toolbar(api),
            ],
          }),
          parent,
        });
      });
    });
  }
}
