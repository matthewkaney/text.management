import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { oneDark } from "@core/extensions/theme/theme";

import { Tab } from "@core/extensions/layout/tab/state";
import { editorTab } from "./editorTab";

const aboutTab = editorTab.of({
  doc: `text.management version ${appVersion}`,
  extensions: [
    oneDark,
    EditorState.readOnly.of(true),
    EditorView.editable.of(false),
  ],
});
