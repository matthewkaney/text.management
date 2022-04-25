import { EditorView } from "@codemirror/view";

export const evaluationTheme = EditorView.theme({
  "@keyframes flash": {
    from: { backgroundColor: "#FFFFFF" },
    to: { backgroundColor: "#FFFFFF00" },
  },
  ".evaluated": { animation: "flash 0.5s" },
});
