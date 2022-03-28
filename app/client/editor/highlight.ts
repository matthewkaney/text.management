import { EditorView, Decoration, DecorationSet } from "@codemirror/view";
import { StateField, StateEffect } from "@codemirror/state";

const evaluate =
  StateEffect.define<{ from: number; to: number; time: DOMHighResTimeStamp }>();

const evaluationField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(underlines, tr) {
    underlines = underlines.map(tr.changes);
    for (let e of tr.effects)
      if (e.is(evaluate)) {
        underlines = underlines.update({
          add: [evaluationMark.range(e.value.from, e.value.to)],
        });
      }
    return underlines;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const evaluationMark = Decoration.mark({ class: "cm-evaluated" });

const evaluationTheme = EditorView.baseTheme({
  ".cm-evaluated": { background: "rgba(255, 255, 255, 0.5)" },
});

export function evaluateSelection(view: EditorView, from: number, to: number) {
  let effects: StateEffect<unknown>[] = [
    evaluate.of({ from, to, time: performance.now() }),
  ];

  if (!view.state.field(evaluationField, false))
    effects.push(
      StateEffect.appendConfig.of([evaluationField, evaluationTheme])
    );
  view.dispatch({ effects });
  return true;
}
