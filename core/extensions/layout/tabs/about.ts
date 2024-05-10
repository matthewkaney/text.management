import { EditorState, EditorStateConfig } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { oneDark } from "@core/extensions/theme/theme";

import { LayoutView, TabView } from "../view";
import { EditorTabState } from "./editor";

export class AboutTabState extends EditorTabState {
  static create(config?: EditorStateConfig) {
    return new AboutTabState(EditorState.create(config));
  }

  swapContents(contents: EditorState) {
    return new EditorTabState(contents, this.id);
  }

  get name() {
    return "About";
  }

  get fileID() {
    return null;
  }

  get title() {
    return null;
  }
}

export class AboutTabView extends TabView<EditorState> {
  private editor;

  constructor(layout: LayoutView, appVersion: string) {
    const state = AboutTabState.create({
      doc: `text.management version ${appVersion}`,
      extensions: [
        oneDark,
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
      ],
    });
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
