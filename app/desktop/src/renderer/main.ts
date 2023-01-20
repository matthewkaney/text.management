import { combineLatest, Subscription } from "rxjs";

import { EditorState } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { EditorView, keymap } from "@codemirror/view";
import { evaluation } from "@management/cm-evaluate";
import { basicSetup } from "@core/extensions/basicSetup";
import { oneDark } from "@core/extensions/theme/theme";
import { tidal } from "@management/lang-tidal/editor";

import { EditorLayout } from "@core/extensions/layout";
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
    let layout = new EditorLayout(parent);
    let titleSubscription: Subscription;

    api.on("open", ({ tab }) => {
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
