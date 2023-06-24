import { EditorState, EditorStateConfig } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { LayoutView, TabView } from "../view";
import { LayoutTransaction, TabState, swapContents } from "../state";
import {
  getFileName,
  getFileID,
} from "../../../../app/desktop/src/renderer/file";

export class EditorTabState extends TabState<EditorState> {
  static create(config?: EditorStateConfig) {
    return new EditorTabState(EditorState.create(config));
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

  constructor(layout: LayoutView, config?: EditorStateConfig) {
    const state = EditorTabState.create(config);
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

  update(tr: LayoutTransaction) {
    super.update(tr);

    if (
      tr.startState.current !== this.state.id &&
      tr.state.current === this.state.id
    ) {
      this.editor.focus();
    }
  }

  destroy() {
    this.editor.destroy();
  }
}
