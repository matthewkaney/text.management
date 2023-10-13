import { ElectronAPI } from "../preload";

import { Text } from "@codemirror/state";
import { evaluation } from "@management/cm-evaluate";
import { basicSetup } from "@core/extensions/basicSetup";
import { oneDark } from "@core/extensions/theme/theme";
import { tidal } from "@management/lang-tidal/editor";

import { LayoutView } from "@core/extensions/layout";
import { console as electronConsole } from "@core/extensions/console";
// import { peer } from "@core/extensions/peer";
import { toolbar } from "@core/extensions/toolbar";

import { fileSync } from "./file";
import { EditorTabView } from "@core/extensions/layout/tabs/editor";
import { AboutTabView } from "@core/extensions/layout/tabs/about";
import { TerminalMessage, Evaluation } from "@core/api";

window.addEventListener("load", () => {
  const parent = document.body.appendChild(document.createElement("section"));
  parent.id = "editor";
  new Editor(parent);
});

const { api } = window as Window &
  typeof globalThis & {
    api: typeof ElectronAPI;
  };

const background: string | null = null;

export class Editor {
  constructor(parent: HTMLElement) {
    let layout = new LayoutView(parent, api.setCurrent);

    if (background) {
      let canvas = parent.appendChild(document.createElement("iframe"));
      canvas.src = background;
      canvas.classList.add("background");
    }

    // Keep track of Tidal state
    let tidalVersion: string | undefined;
    let tidalConsole: (TerminalMessage | Evaluation)[] = [];

    api.onTidalVersion((version) => {
      tidalVersion = version;
    });

    api.onConsoleMessage((message) => {
      tidalConsole.push(message);
    });

    api.onOpen(({ id, path }) => {
      let offContent = api.onContent(id, ({ doc: docJSON, version, saved }) => {
        let doc = Text.of(docJSON);

        layout.dispatch({
          changes: [
            {
              view: new EditorTabView(layout, id, api, {
                doc,
                extensions: [
                  tidal(),
                  evaluation(api.evaluate),
                  basicSetup,
                  oneDark,
                  fileSync(
                    id,
                    { path, saved, version, thisVersion: version },
                    api
                  ),
                  electronConsole(api, tidalConsole),
                  toolbar(api, tidalVersion),
                  // peer(version),
                ],
              }),
            },
          ],
        });

        offContent();
      });
    });

    api.onClose(({ id }) => {
      layout.dispatch({ changes: [id] });
    });

    api.onSetCurrent(({ id }) => {
      layout.dispatch({ current: id });
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
