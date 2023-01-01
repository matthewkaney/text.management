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

const { api } = window as Window &
  typeof globalThis & {
    api: TextManagementAPI;
  };

window.addEventListener("load", () => {
  const parent = document.body.appendChild(document.createElement("section"));
  parent.id = "editor";
  new Editor(parent);
});

export class Editor {
  constructor(parent: HTMLElement) {
    let editor: EditorView | undefined;

    api.on("doc", ({ name, doc }) => {
      document.title = name;

      if (editor) {
        editor.destroy();
      }

      doc.then((contents) => {
        editor = new EditorView({
          state: EditorState.create({
            doc: Text.of(contents),
            extensions: [
              tidal(),
              keymap.of([indentWithTab]),
              evaluation(),
              basicSetup,
              oneDark,
              electronConsole(api),
              peer(api, 0),
              toolbar(api),
            ],
          }),
          parent,
        });
      });
    });
  }
}
