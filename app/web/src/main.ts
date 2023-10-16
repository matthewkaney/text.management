import { indentWithTab } from "@codemirror/commands";
import { EditorView, keymap } from "@codemirror/view";
import { evaluation } from "@management/cm-evaluate";
import { basicSetup } from "@core/extensions/basicSetup";
import { oneDark } from "@core/extensions/theme/theme";
import { tidal } from "@management/lang-tidal/editor";

import { EditorState, Text } from "@codemirror/state";

import { LayoutView } from "@core/extensions/layout";
import { EditorTabView } from "@core/extensions/layout/tabs/editor";

import { ElectronAPI } from "@core/api";
import { console as electronConsole } from "@core/extensions/console";
import { peer } from "@core/extensions/peer";
import { SettingsPage } from "@core/extensions/settings";
import { toolbar } from "@core/extensions/toolbar";
import { fileSync } from "../../desktop/src/renderer/file";

let empty = () => {};
let emptyHandler = () => empty;

// @ts-ignore
const emptyApi: typeof ElectronAPI = {
  setCurrent: empty,
  onOpen: emptyHandler,
  onContent: emptyHandler,
  onStatus: emptyHandler,
  update: empty,
  requestClose: empty,
  onShowAbout: emptyHandler,
  onClose: emptyHandler,
  onConsoleMessage: emptyHandler,
  onTidalVersion: emptyHandler,
  evaluate: empty,
};

window.addEventListener("load", () => {
  const parent = document.body.appendChild(document.createElement("section"));
  parent.id = "editor";
  new Editor(parent);
});

export class Editor {
  constructor(parent: HTMLElement) {
    let layout = new LayoutView(parent, () => {}, () => {});
    layout.dispatch({
      changes: [
        {
          view: new EditorTabView(layout, "editor", emptyApi, {
            doc: Text.of([""]),
            extensions: [
              tidal(),
              keymap.of([indentWithTab]),
              // evaluation(),
              basicSetup,
              oneDark,
              fileSync(
                "editor",
                { path: null, saved: false, version: 0, thisVersion: 0 },
                emptyApi
              ),
              // electronConsole(api),
              // peer(api, 0),
              // @ts-ignore
              toolbar(emptyApi, "1.9.4"),
            ],
          }),
        },
      ],
    });
  }
}
