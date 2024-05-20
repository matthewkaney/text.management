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

export const managementTheme = EditorView.theme({
  "&": {
    fontFamily: "inherit",
    width: "100%",
    height: "100%",
    overflow: "auto",
    color: col("foreground"),
    "& ::selection": { backgroundColor: selection },
    caretColor: col("foreground"),
  },

  ".cm-scroller": {
    margin: `var(--s-2)`,
  },

  ".cm-scroller:not(:last-child)": {
    marginBottom: "0",
  },

  ".cm-line": {
    width: "fit-content",
    padding: `0 var(--s-0-5)`,
    backgroundColor: col("ui-background"),
  },

  ".cm-line:first-child, .cm-line.cm-emptyLine + .cm-line:not(.cm-emptyLine)": {
    paddingTop: "var(--s-0-5)",
    marginTop: "calc(var(--s-0-5) * -1)",
  },

  ".cm-line:last-child, .cm-line:not(.cm-emptyLine):has(+ .cm-emptyLine)": {
    paddingBottom: "var(--s-0-5)",
    marginBottom: "calc(var(--s-0-5) * -1)",
  },

  ".cm-emptyLine:not(.cm-activeLine)": {
    padding: "0",
  },

  // ".cm-gutters": {
  //   marginRight: `${size}px`,
  // },

  // ".cm-lineNumbers .cm-gutterElement": {
  //   padding: `0 ${0.5 * size}px`,
  // },

  ".cm-content": { padding: "var(--s-0-5) 0" },

  "&.cm-editor.cm-focused": { outline: "none" },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: col("foreground"),
    borderLeftWidth: "2px",
    marginLeft: "-1px",
  },

  "&.cm-tab-focus": {
    boxShadow: "inset 0 0 0 4px var(--color-focus-border)",
  },

  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
    background: col("selection-background"),
  },

  "&.cm-focused ::selection": {
    background: "transparent",
  },

  ".cm-selectionBackground": {
    background: col("selection-background"),
    color: col("foreground-invert"),
  },

  "& .cm-scroller": {
    fontFamily: "inherit",
    lineHeight: "inherit",
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
});

/// The highlighting style for code in the One Dark theme.
export const oneDarkHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: col("syntax-keyword") },
  {
    tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName],
    color: col("foreground"),
  },
  {
    tag: [t.function(t.variableName), t.labelName],
    color: col("foreground"),
  },
  {
    tag: [t.color, t.constant(t.name), t.standard(t.name)],
    color: col("syntax-operator"),
  },
  { tag: [t.definition(t.name), t.separator], color: col("foreground") },
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
    color: col("syntax-number"),
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
    color: col("syntax-operator"),
  },
  { tag: [t.meta, t.comment], color: col("syntax-comment") },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.link, textDecoration: "underline" },
  {
    tag: [t.atom, t.bool, t.special(t.variableName)],
    color: col("syntax-variable"),
  },
  {
    tag: [t.processingInstruction, t.string, t.inserted],
    color: col("syntax-string"),
  },
  { tag: t.invalid, color: col("error-foreground") },
  { tag: t.bracket, color: col("syntax-bracket") },
]);

/// Extension to enable the One Dark theme (both the editor theme and
/// the highlight style).
export const oneDark: Extension = [
  managementTheme,
  syntaxHighlighting(oneDarkHighlightStyle),
];
