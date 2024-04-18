import { ElectronAPI } from "../preload";

import { EditorState, Text, StateEffect } from "@codemirror/state";
import { evaluation } from "@management/cm-evaluate";
import { basicSetup } from "@core/extensions/basicSetup";
import { oneDark } from "@core/extensions/theme/theme";
import { tidal } from "@management/lang-tidal/editor";

import { applyTransaction, LayoutView } from "@core/extensions/layout";
import {
  console as electronConsole,
  toTerminalMessage,
} from "@core/extensions/console";
import { peer } from "@core/extensions/firebase/peer";
import { toolbarConstructor } from "@core/extensions/toolbar";

import { fileSync, getFileName, remoteFileSync } from "./file";
import { EditorTabView } from "@core/extensions/layout/tabs/editor";
import { AboutTabView } from "@core/extensions/layout/tabs/about";

import { set, child, onChildAdded, query } from "firebase/database";
import { getSession, createSession } from "@core/extensions/firebase/session";
import { stateFromDatabase } from "@core/extensions/firebase/editorState";

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
    let layout = new LayoutView(parent, api.setCurrent, api.newTab);

    if (background) {
      let canvas = parent.appendChild(document.createElement("iframe"));
      canvas.src = background;
      canvas.classList.add("background");
    }

    // Keep track of Tidal state
    let tidalVersion: string | undefined;

    // Append Tidal UI Panels
    let tidalConsole = electronConsole();
    layout.panelArea.appendChild(tidalConsole.dom);

    let toolbar = toolbarConstructor(api, tidalVersion);
    layout.panelArea.appendChild(toolbar.dom);

    api.onTidalVersion((version) => {
      tidalVersion = version;
    });

    api.onToggleConsole(() => {
      tidalConsole.toggleVisibility();
    });

    api.onConsoleMessage((message) => {
      tidalConsole.update(toTerminalMessage(message, "Tidal"));
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

    api.onJoinRemote(async ({ session }) => {
      let sessionRef =
        typeof session === "string" ? getSession(session) : createSession();

      tidalConsole.update(
        toTerminalMessage(
          { level: "info", output: `Joined session: ${sessionRef.key}` },
          "System"
        )
      );

      let documents: {
        [id: string]: { start: { text: string[]; version: number } };
      } = {};

      for (let tabID in layout.state.tabs) {
        let { contents } = layout.state.tabs[tabID];
        if (contents instanceof EditorState) {
          let text = contents.doc.toJSON();
          let version = 0;
          documents[tabID] = { start: { text, version } };
        }
      }

      set(sessionRef, { documents });

      onChildAdded(child(sessionRef, "documents"), (doc) => {
        let id = doc.key;
        if (id === null) throw Error("Firebase somehow added a null child");

        if (id in layout.state.tabs) {
          let tabState = layout.state.tabs[id].contents;

          if (!(tabState instanceof EditorState))
            throw Error("Tried to sync a non-editor tab");

          layout.dispatch({
            effects: [
              applyTransaction.of({
                id,
                transaction: tabState.update({
                  effects: StateEffect.appendConfig.of([peer(doc)]),
                }),
              }),
            ],
          });
        } else {
          layout.dispatch({
            changes: [
              {
                view: new EditorTabView(
                  layout,
                  id,
                  api,
                  stateFromDatabase(doc, [
                    tidal(),
                    evaluation(api.evaluate),
                    basicSetup,
                    oneDark,
                    remoteFileSync("Remote File"),
                    // remoteConsole(session),
                  ])
                ),
              },
            ],
          });
        }
      });
    });
  }
}
