import { ElectronAPI } from "../preload";

import { EditorState, StateField, StateEffect } from "@codemirror/state";
import { ViewPlugin } from "@codemirror/view";

import { SavedStatus } from "../main/filesystem";

const statusEffect = StateEffect.define<SavedStatus>();

interface FileStatus {
  path: null | string;
  saved: boolean | "saving";
  version: number;
  thisVersion: number;
}

const saveState = StateField.define<FileStatus>({
  create: () => ({
    path: null,
    saved: false,
    version: 0,
    thisVersion: 0,
  }),
  update: (value, tr) => {
    if (!tr.changes.empty) {
      value = { ...value, thisVersion: value.thisVersion + 1 };
    }

    for (let effect of tr.effects) {
      if (effect.is(statusEffect) && effect.value.version >= value.version) {
        value = { ...value, ...effect.value };
      }
    }

    return value;
  },
});

export function fileSync(
  id: string,
  status: FileStatus,
  api: typeof ElectronAPI
) {
  return ViewPlugin.define(
    (view) => {
      let offStatus = api.onStatus(id, (status) => {
        view.dispatch({ effects: statusEffect.of(status) });
      });

      let saveHistory = view.state.field(saveState);

      return {
        update: ({ state, changes }) => {
          if (saveHistory !== state.field(saveState)) {
            saveHistory = state.field(saveState);

            api.update(id, {
              version: saveHistory.thisVersion,
              clientID: "",
              changes: changes.toJSON(),
            });
          }
        },
        destroy: () => {
          offStatus();
        },
      };
    },
    { provide: () => saveState.init(() => status) }
  );
}

export function getSaveStatus(state: EditorState) {
  const { version, thisVersion, saved } = state.field(saveState);

  return version === thisVersion ? saved : false;
}

function basename(path: string) {
  let parts = path.split("/");
  return parts[parts.length - 1];
}

export function getFileName(state: EditorState) {
  const { path } = state.field(saveState);
  const saved = getSaveStatus(state);

  return (path ? basename(path) : "untitled") + (saved === true ? "" : " •");
}
