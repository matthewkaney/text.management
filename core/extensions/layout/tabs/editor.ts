import { EditorState, EditorStateConfig } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { LayoutView, TabView } from "../view";
import {
  LayoutTransaction,
  TabState,
  focusCurrent,
  swapContents,
} from "../state";
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

  // TODO: ScrollTarget type isn't exported currently
  private scrollSnapshot: any | null = null;

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

  update(tr: LayoutTransaction) {
    super.update(tr);

    if (tr.state.current === this.state.id) {
      if (
        tr.startState.current !== this.state.id ||
        tr.effects.some((e) => e.is(focusCurrent))
      ) {
        this.editor.focus();
      }
    }
  }

  beforeUnmount() {
    this.scrollSnapshot = this.editor.scrollSnapshot();
  }

  afterMount() {
    if (this.scrollSnapshot !== null) {
      this.editor.update([
        this.editor.state.update({ effects: this.scrollSnapshot }),
      ]);
    }
  }

  beforeClose() {
    this.api.requestClose(this.state.id);
    return false;
  }

  destroy() {
    this.editor.destroy();
  }
}
