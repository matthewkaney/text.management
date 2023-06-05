import { combineLatest, Subscription } from "rxjs";

import { ElectronAPI } from "../preload";

import { EditorState, Text } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { EditorView, keymap, ViewPlugin } from "@codemirror/view";
import { evaluation } from "@management/cm-evaluate";
import { basicSetup } from "@core/extensions/basicSetup";
import { oneDark } from "@core/extensions/theme/theme";
import { tidal } from "@management/lang-tidal/editor";

import { LayoutView } from "@core/extensions/layout";
import { console as electronConsole } from "@core/extensions/console";
import { peer } from "@core/extensions/peer";
import { toolbar } from "@core/extensions/toolbar";
import { fileSync } from "./file";

window.addEventListener("load", () => {
  const parent = document.body.appendChild(document.createElement("section"));
  parent.id = "editor";
  new Editor(parent);
});

const { api } = window as Window &
  typeof globalThis & {
    api: ElectronAPI;
  };

export class Editor {
  constructor(parent: HTMLElement) {
    let layout = new LayoutView(parent);

    api.onOpen(({ id, path }) => {
      let offContent = api.onContent(id, ({ doc: docJSON, version }) => {
        let doc = Text.of(docJSON);

        layout.dispatch({
          current: layout.children.length,
          changes: [
            {
              name: path || "untitled *",
              doc,
              extensions: [
                tidal(),
                keymap.of([indentWithTab]),
                evaluation(),
                basicSetup,
                oneDark,
                fileSync(
                  id,
                  version,
                  doc,
                  (saveState) => {},
                  api.update,
                  api.onSaved
                ),
                // electronConsole(api),
                // peer(version),
                // toolbar(api),
              ],
            },
          ],
        });

        offContent();
      });
    });
  }
}
