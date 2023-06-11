import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { Tab } from "@core/extensions/layout/tab/state";

export const editorTab = Tab.define((view) => {
  let editor = new EditorView(view.state.content);

  return {
    dom: editor.dom,
  };
}, EditorState.create);
