import { indentWithTab } from "@codemirror/commands";
import { EditorView, keymap } from "@codemirror/view";
import { evaluation } from "@management/cm-evaluate";
import { basicSetup } from "@core/extensions/basicSetup";
import { oneDark } from "@core/extensions/theme/theme";
import { tidal } from "@management/lang-tidal/editor";

import { EditorState } from "@codemirror/state";

import { EditorLayout } from "@core/extensions/layout";
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
    let layout = new EditorLayout(parent);

    api.on("open", ({ tab }) => {
      console.log("THING OPENED!");
      // document.title = tab.name$.value;

      tab.content.then((content) => {
        let { initialText, initialVersion } = content;

        layout.addTab(
          tab.name$.value,
          new EditorView({
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
          })
        );
      });
    });
  }
}
