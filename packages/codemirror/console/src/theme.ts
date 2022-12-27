import { EditorView } from "@codemirror/view";

export const consoleTheme = EditorView.theme({
  "& .cm-console": {
    color: "#fff",
    lineHeight: 1.4,
  },
});
