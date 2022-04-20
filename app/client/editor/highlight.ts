import {
  EditorView,
  ViewPlugin,
  ViewUpdate,
  Decoration,
} from "@codemirror/view";
import { StateEffect, Transaction } from "@codemirror/state";

const evaluate = StateEffect.define<{ from: number; to: number }>();

export function evaluationFlash() {
  const lifespan = 2000;

  return [
    ViewPlugin.fromClass(
      class {
        decorations = Decoration.none;

        update({ transactions }: ViewUpdate) {
          for (let tr of transactions) {
            this.decorations = this.decorations.map(tr.changes);

            this.decorations = this.decorations.update({
              add: tr.effects
                .filter((e) => e.is(evaluate) && e.value.from !== e.value.to)
                .map(({ value: { from, to } }) =>
                  Decoration.mark({
                    class: "evaluated",
                    time: tr.annotation(Transaction.time),
                  }).range(from, to)
                ),
              sort: true,
              filter: (_f, _t, { spec: { time } }) => {
                return typeof time === "number" && time + lifespan > Date.now();
              },
            });
          }
        }
      },
      { decorations: (v) => v.decorations }
    ),
    evaluationTheme,
  ];
}

const evaluationTheme = EditorView.baseTheme({
  ".evaluated": { background: "rgba(255, 255, 255, 0.5)" },
});

export function evaluateSelection(view: EditorView, from: number, to: number) {
  let effects = [evaluate.of({ from, to })];

  view.dispatch({ effects });
  return true;
}
