import { EditorState, EditorStateConfig } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { LayoutView, TabView } from "../view";
import { TabState, swapContents } from "../state";
import {
  getFileName,
  getFileID,
} from "../../../../app/desktop/src/renderer/file";

import { ElectronAPI } from "@core/api";

export class EditorTabState extends TabState<EditorState> {
  static create(config?: EditorStateConfig, id?: string) {
    return new EditorTabState(EditorState.create(config), id);
  }

  swapContents(contents: EditorState) {
    return new EditorTabState(contents, this.id);
  }

  get name() {
    return getFileName(this.contents);
  }

  get fileID() {
    return getFileID(this.contents);
  }
}

export class EditorTabView extends TabView<EditorState> {
  private editor;

  constructor(
    layout: LayoutView,
    id: string,
    private api: typeof ElectronAPI,
    config?: EditorStateConfig
  ) {
    const state = EditorTabState.create(config, id);
    super(layout, state);

    // Set up dom...

    this.editor = new EditorView({
      state: this.state.contents,
      parent: this.dom,
      dispatch: (tr) => {
        this.layout.dispatch({
          effects: [swapContents.of({ id: this.state.id, contents: tr.state })],
        });
        this.editor.update([tr]);
      },
    });
  }

  beforeClose() {
    this.api.requestClose(this.state.id);
    return false;
  }

  destroy() {
    this.editor.destroy();
  }
}
