import { EditorView } from "@codemirror/view";

export const evalTheme = EditorView.theme({
  "& .cm-evaluated": { backgroundColor: "#FFFFFF" },
});
