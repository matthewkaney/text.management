import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { oneDark } from "@core/extensions/theme/theme";

import { LayoutView } from "../view";
import { EditorTabView } from "./editor";

export class AboutTabView extends EditorTabView {
  constructor(layout: LayoutView, appVersion: string) {
    super(layout, {
      doc: `text.management version ${appVersion}`,
      extensions: [
        oneDark,
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
      ],
    });
  }
}
