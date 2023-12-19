import { EditorView } from "@codemirror/view";

export const consoleTheme = EditorView.theme({
  "& .cm-console": {
    lineHeight: 1.4,
  },
});
