import { indentWithTab } from "@codemirror/commands";
import { haskell } from "@codemirror/legacy-modes/mode/haskell";
import { StreamLanguage } from "@codemirror/language";
import { EditorView, keymap } from "@codemirror/view";
import { evaluation } from "@management/cm-evaluate";
import { basicSetup } from "@core/client/editor/basicSetup";
import { oneDark } from "@core/extensions/theme/theme";
import { decorateEmptyLines } from "@core/client/editor/emptyLines";

import { EditorState, Text } from "@codemirror/state";

import { TextManagementAPI } from "@core/api";
import { console as electronConsole } from "@core/extensions/console";
import { peer } from "@core/extensions/peer";
import { toolbar } from "@core/extensions/toolbar";

const { api } = window as Window &
  typeof globalThis & { api: TextManagementAPI };

window.addEventListener("load", () => {
  const parent = document.body.appendChild(document.createElement("section"));
  parent.id = "editor";
  new Editor(parent);
});

export class Editor {
  constructor(parent: HTMLElement) {
    return new EditorView({
      state: EditorState.create({
        doc: Text.of([""]),
        extensions: [
          keymap.of([indentWithTab]),
          evaluation(),
          basicSetup,
          oneDark,
          StreamLanguage.define(haskell),
          electronConsole(api),
          peer(api, 0),
          toolbar,
        ],
      }),
      parent,
    });
  }
}
