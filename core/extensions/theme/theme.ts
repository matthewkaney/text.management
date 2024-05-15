import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// Using https://github.com/one-dark/vscode-one-dark-theme/ as reference for the colors

const col = (name: string) => `var(--color-${name})`;

const coral = "#e06c75",
  ivory = "#abb2bf",
  stone = "#7d8799", // Brightened compared to original to increase contrast
  whiskey = "#d19a66",
  violet = "#c678dd",
  highlightBackground = "#2c313a",
  selection = "#3E4451";

const size = 12;

export const base = EditorView.theme({
  "&": {
    fontFamily: "Fira Code, monospace",
    width: "100%",
    height: "100%",
    overflow: "auto",
  },

  ".cm-line": {
    width: "fit-content",
  },
});

export const layoutTheme = EditorView.theme({
  "&": {
    fontSize: `${1.6363 * size}px`,
    lineHeight: `${2.5 * size}px`,
  },

  ".cm-scroller": {
    margin: `${1.5 * size}px`,
  },

  ".cm-scroller:not(:last-child)": {
    marginBottom: "0",
  },

  ".cm-line": {
    padding: `0 ${0.5 * size}px`,
  },

  ".cm-emptyLine:not(.cm-activeLine)": {
    padding: "0",
  },

  ".cm-gutters": {
    marginRight: `${size}px`,
  },

  ".cm-lineNumbers .cm-gutterElement": {
    padding: `0 ${0.5 * size}px`,
  },

  "*::-webkit-scrollbar": {
    width: `${size}px`,
  },
});

/// The editor theme styles for One Dark.
export const oneDarkTheme = EditorView.theme({
  "&": {
    color: col("foreground"),
    "& ::selection": { backgroundColor: selection },
    caretColor: col("foreground"),
    fontFamily: "inherit",
  },

  ".cm-content": { padding: 0 },

  "&.cm-editor.cm-focused": { outline: "none" },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: col("foreground"),
    borderLeftWidth: "2px",
    marginLeft: "-1px",
  },

  "&.cm-tab-focus": {
    boxShadow: "inset 0 0 0 4px orange",
  },

  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: col("text-invert"),
  },

  "& .cm-scroller": {
    fontFamily: "Fira Code, monospace",
    lineHeight: "inherit",
  },

  ".cm-line": {
    backgroundColor: col("ui-background"),
  },

  ".cm-line.cm-activeLine": {
    boxShadow: "0 0 2px --color-background",
  },

  ".cm-searchMatch": {
    backgroundColor: "#72a1ff59",
    outline: "1px solid #457dff",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "#6199ff2f",
  },

  ".cm-selectionMatch": { backgroundColor: "#aafe661a" },

  "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
    backgroundColor: col("text-2"),
    color: col("text-invert"),
  },

  ".cm-matchingBracket, .cm-nonmatchingBracket": {
    backgroundColor: "transparent",
    boxShadow: `inset 0 0 0 2px ${col("text-2")}`,
  },

  ".cm-gutters": {
    backgroundColor: col("ui-background"),
    color: col("foreground"),
    border: "none",
  },

  ".cm-lineNumbers .cm-gutterElement": {
    color: "inherit",
  },

  ".cm-foldPlaceholder": {
    backgroundColor: "transparent",
    border: "none",
    color: "#ddd",
  },

  ".cm-tooltip": {
    border: "1px solid #181a1f",
    backgroundColor: col("background"),
  },
  ".cm-tooltip-autocomplete": {
    "& > ul > li[aria-selected]": {
      backgroundColor: highlightBackground,
      color: ivory,
    },
  },

  "*::-webkit-scrollbar-thumb": {
    backgroundColor: col("ui-background-inactive"),
  },
  "*::-webkit-scrollbar-thumb:hover": {
    backgroundColor: col("ui-background"),
  },
  "*::-webkit-scrollbar-corner": {
    backgroundColor: "transparent",
  },
});

/// The highlighting style for code in the One Dark theme.
export const oneDarkHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: violet },
  {
    tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName],
    color: col("foreground"),
  },
  { tag: [t.function(t.variableName), t.labelName], color: col("foreground") },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: whiskey },
  { tag: [t.definition(t.name), t.separator], color: ivory },
  {
    tag: [
      t.typeName,
      t.className,
      t.number,
      t.changed,
      t.annotation,
      t.modifier,
      t.self,
      t.namespace,
    ],
    color: col("text-4"),
  },
  {
    tag: [
      t.operator,
      t.operatorKeyword,
      t.url,
      t.escape,
      t.regexp,
      t.link,
      t.special(t.string),
    ],
    color: col("text-1"),
  },
  { tag: [t.meta, t.comment], color: col("text-soft") },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.link, color: stone, textDecoration: "underline" },
  { tag: t.heading, fontWeight: "bold", color: coral },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: whiskey },
  {
    tag: [t.processingInstruction, t.string, t.inserted],
    color: col("text-3"),
  },
  { tag: t.invalid, color: col("text-soft") },
  { tag: t.bracket, color: col("text-2") },
]);

/// Extension to enable the One Dark theme (both the editor theme and
/// the highlight style).
export const oneDark: Extension = [
  base,
  layoutTheme,
  oneDarkTheme,
  syntaxHighlighting(oneDarkHighlightStyle),
];
