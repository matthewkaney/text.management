import { EditorView } from "@codemirror/view";

export const consoleTheme = EditorView.theme({
  "& .cm-console": {
    color: "#fff",
    fontFamily: "monospace",
    lineHeight: 1.4,
  },
});
