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

import { ElectronTab, api } from "./api";

window.addEventListener("load", () => {
  const parent = document.body.appendChild(document.createElement("section"));
  parent.id = "editor";
  new Editor(parent);
});

export class Editor {
  constructor(parent: HTMLElement) {
    let editor: EditorView | undefined;

    api.on("open", ({ tab }) => {
      let name = tab.name$.value;
      document.title = name;

      if (tab instanceof ElectronTab) {
        tab.content.then((content) => {
          content.saveState$.subscribe({
            next: (saved) => {
              document.title = name + (saved ? "" : "*");
            },
          });
        });
      }

      if (editor) {
        editor.destroy();
      }

      tab.content.then((content) => {
        let { initialText, initialVersion } = content;

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
              peer(content, initialVersion),
              toolbar(api),
            ],
          }),
          parent,
        });
      });
    });
  }
}
