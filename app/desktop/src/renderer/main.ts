import { indentWithTab } from "@codemirror/commands";
import { EditorView, keymap } from "@codemirror/view";
import { evaluation } from "@management/cm-evaluate";
import { basicSetup } from "@core/client/editor/basicSetup";
import { oneDark } from "@core/extensions/theme/theme";
import { tidal } from "@management/lang-tidal/editor";

import { EditorState, Text } from "@codemirror/state";

import { TextManagementAPI } from "@core/api";
import { console as electronConsole } from "@core/extensions/console";
import { peer } from "@core/extensions/peer";
import { toolbar } from "@core/extensions/toolbar";
import { OpenDialogOptions } from "electron";

const { api } = window as Window &
  typeof globalThis & {
    api: TextManagementAPI & { openFile: () => Promise<OpenDialogOptions> };
  };

window.addEventListener("load", () => {
  const parent = document.body.appendChild(document.createElement("section"));
  parent.id = "editor";
  new Editor(parent);
});

let fileKeymap = keymap.of([
  {
    key: "Mod-o",
    run: () => {
      console.log("HELLO!");
      api.openFile();
      return true;
    },
  },
]);

export class Editor {
  constructor(parent: HTMLElement) {
    return new EditorView({
      state: EditorState.create({
        doc: Text.of([""]),
        extensions: [
          tidal(),
          keymap.of([indentWithTab]),
          evaluation(),
          basicSetup,
          oneDark,
          electronConsole(api),
          peer(api, 0),
          fileKeymap,
          toolbar(api),
        ],
      }),
      parent,
    });
  }
}
