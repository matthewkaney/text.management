import { indentWithTab } from "@codemirror/commands";
import { haskell } from "@codemirror/legacy-modes/mode/haskell";
import { StreamLanguage } from "@codemirror/language";
import { EditorView, keymap } from "@codemirror/view";
import { evaluation } from "@management/cm-evaluate";
import { basicSetup } from "../../../../packages/text-management/src/client/editor/basicSetup";
import { oneDark } from "../../../../packages/text-management/src/client/editor/theme";
import { decorateEmptyLines } from "../../../../packages/text-management/src/client/editor/emptyLines";
import { peer } from "../../../../packages/text-management/src/client/editor/peer";

import { EditorState, Text } from "@codemirror/state";

import { electronConsole } from "./editor/console";

import { TextManagementAPI } from "../../../../packages/text-management/src/api";

const { api } = window as Window &
  typeof globalThis & { api: TextManagementAPI };

console.log(api);

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
        ],
      }),
      parent,
    });
  }
}
