import { ElectronAPI } from "../preload";

import { Text } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { keymap } from "@codemirror/view";
import { evaluation } from "@management/cm-evaluate";
import { basicSetup } from "@core/extensions/basicSetup";
import { oneDark } from "@core/extensions/theme/theme";
import { tidal } from "@management/lang-tidal/editor";

import { LayoutView } from "@core/extensions/layout";
import { console as electronConsole } from "@core/extensions/console";
import { peer } from "@core/extensions/peer";
import { toolbar } from "@core/extensions/toolbar";

import { fileSync } from "./file";
import { EditorTabView } from "@core/extensions/layout/tabs/editor";
import { AboutTabView } from "@core/extensions/layout/tabs/about";

function basename(path: string) {
  let parts = path.split("/");
  return parts[parts.length - 1];
}

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
    let layout = new LayoutView(parent, api.setCurrent);

    api.onOpen(({ id, path }) => {
      let offContent = api.onContent(id, ({ doc: docJSON, version }) => {
        let doc = Text.of(docJSON);

        layout.dispatch({
          changes: [
            {
              view: new EditorTabView(layout, {
                fileID: id,
                doc,
                extensions: [
                  tidal(),
                  keymap.of([indentWithTab]),
                  evaluation(),
                  basicSetup,
                  oneDark,
                  fileSync(id, layout, api.update, api.onSaved),
                  // electronConsole(api),
                  // peer(version),
                  // toolbar(api),
                ],
              }),
            },
          ],
        });

        offContent();
      });
    });

    api.onShowAbout((appVersion) => {
      layout.dispatch({
        changes: [
          {
            view: new AboutTabView(layout, appVersion),
          },
        ],
      });
    });
  }
}
