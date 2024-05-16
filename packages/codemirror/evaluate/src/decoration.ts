import { EditorView, ViewPlugin, Decoration } from "@codemirror/view";
import { Facet, StateEffect } from "@codemirror/state";

import { Evaluation, evaluationEffect } from "./evaluate";

export const flashDuration = Facet.define({
  combine(values: readonly number[]) {
    return values.reduce((a, b) => Math.max(a, b), 200);
  },
});

const endEvalEffect = StateEffect.define<Evaluation>();

const evaluationTheme = EditorView.baseTheme({
  "& .cm-evaluated": { backgroundColor: "#FFFFFF" },
});

export const evaluateDecorationPlugin = ViewPlugin.define(
  (view) => {
    let decorations = Decoration.none;
    let timers = new Set<number>();

    return {
      update: ({ state, transactions }) => {
        let flashTime = state.facet(flashDuration);

        for (let tr of transactions) {
          if (tr.docChanged) {
            decorations = decorations.map(tr.changes);
          }

          for (let effect of tr.effects) {
            if (
              effect.is(evaluationEffect) &&
              effect.value.span !== undefined
            ) {
              let { from, to } = effect.value.span;

              if (from === to) break;

              let timer = window.setTimeout(() => {
                timers.delete(timer);
                view.dispatch({ effects: endEvalEffect.of(effect.value) });
              }, flashTime);

              timers.add(timer);

              decorations = decorations.update({
                add: [
                  Decoration.mark({
                    class: "cm-evaluated",
                    evaluation: effect.value,
                  }).range(from, to),
                ],
              });
            } else if (effect.is(endEvalEffect)) {
              decorations = decorations.update({
                filter: (_f, _t, value) =>
                  value.spec.evaluation !== effect.value,
              });
            }
          }
        }
      },

      destroy: () => {
        for (let timer of timers) {
          window.clearTimeout(timer);
        }
      },

      getDecorations: () => decorations,
    };
  },
  {
    provide: () => evaluationTheme,
    decorations: (value) => value.getDecorations(),
  }
);
