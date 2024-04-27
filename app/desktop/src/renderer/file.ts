import { ElectronAPI } from "../preload";

import {
  EditorState,
  StateField,
  StateEffect,
  Facet,
  Text,
} from "@codemirror/state";
import { ViewPlugin } from "@codemirror/view";

import { SavedStatus } from "../main/filesystem";

type FileID = string | null;
const fileID = Facet.define<FileID, FileID>({
  combine: (inputs) => {
    return inputs[0] ?? null;
  },
  static: true,
});

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
    { provide: () => [saveState.init(() => status), fileID.of(id)] }
  );
}

export function remoteFileSync(path: string) {
  console.log("remote file sync called!");
  return [
    saveState.init(() => ({
      path,
      saved: true,
      version: 0,
      thisVersion: 0,
    })),
    fileID.of(null),
  ];
}

export function getSaveStatus(state: EditorState) {
  const { version, thisVersion, saved } = state.field(saveState);

  // Empty docs are never unsaved
  if (state.doc.eq(Text.empty)) {
    return true;
  }

  return version === thisVersion ? saved : false;
}

function basename(path: string) {
  let parts = path.split("/");
  return parts[parts.length - 1];
}

export function getFileName(state: EditorState) {
  const { path } = state.field(saveState);
  const saved = getSaveStatus(state);

  return (saved === true ? "" : "● ") + (path ? basename(path) : "untitled");
}

export function getFileID(state: EditorState) {
  return state.facet(fileID);
}
