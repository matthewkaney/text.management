import { combineLatest, Subscription } from "rxjs";

import { EditorState } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { EditorView, keymap } from "@codemirror/view";
import { evaluation } from "@management/cm-evaluate";
import { basicSetup } from "@core/extensions/basicSetup";
import { oneDark } from "@core/extensions/theme/theme";
import { tidal } from "@management/lang-tidal/editor";

import { console as electronConsole } from "@core/extensions/console";
import { peer } from "@core/extensions/peer";
import { toolbar } from "@core/extensions/toolbar";

import { ElectronTab } from "./api";
import { Authority } from "./authority";

window.addEventListener("load", () => {
  const parent = document.body.appendChild(document.createElement("section"));
  parent.id = "editor";
  new TextManagement(parent);
});

export class TextManagement {
  constructor(parent: HTMLElement) {
    let editor: EditorView;
    let titleSubscription: Subscription;

    let authority = new Authority();

    authority.on("open", ({ tab }) => {
      let hadFocus = editor?.hasFocus;

      if (editor) {
        editor.destroy();
      }

      if (titleSubscription) {
        titleSubscription.unsubscribe();
      }

      if (tab instanceof ElectronTab) {
        titleSubscription = combineLatest(
          [tab.name$, tab.saveState$],
          (name, saved) => name + (saved ? "" : "*")
        ).subscribe({
          next: (title) => {
            document.title = title;
          },
        });
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
              // electronConsole(api),
              peer(content, initialVersion),
              // toolbar(api),
            ],
          }),
          parent,
        });

        if (hadFocus) {
          editor.focus();
        }
      });
    });
  }
}
