import { EditorState, EditorStateConfig } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { LayoutView, TabView } from "../view";
import { TabState } from "../state";

export class EditorTabState extends TabState<EditorState> {
  static create(config?: EditorStateConfig & { fileID: string | null }) {
    return new EditorTabState(
      EditorState.create(config),
      config?.fileID ?? null
    );
  }

  private constructor(
    readonly contents: EditorState,
    readonly fileID: string | null
  ) {
    super();
  }

  get name() {
    return "untitled";
  }
}

export class EditorTabView extends TabView<EditorState> {
  private editor;

  constructor(
    layout: LayoutView,
    config?: EditorStateConfig & { fileID: string | null }
  ) {
    const state = EditorTabState.create(config);
    super(layout, state);

    // Set up dom...

    this.editor = new EditorView({
      state: this.state.contents,
      parent: this.dom,
    });
  }

  destroy() {
    this.editor.destroy();
  }
}
