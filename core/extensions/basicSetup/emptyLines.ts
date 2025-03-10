import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

const emptyLine = Decoration.line({
  attributes: { class: "cm-emptyLine" },
});

function emptyLineDeco(view: EditorView) {
  let builder = new RangeSetBuilder<Decoration>();
  for (let { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to; ) {
      let line = view.state.doc.lineAt(pos);
      if (
        line.text === "" &&
        line.number !==
          view.state.doc.lineAt(view.state.selection.main.head).number
      )
        builder.add(line.from, line.from, emptyLine);
      pos = line.to + 1;
    }
  }
  return builder.finish();
}

export function decorateEmptyLines() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = emptyLineDeco(view);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet || update.viewportChanged)
          this.decorations = emptyLineDeco(update.view);
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}
