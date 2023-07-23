import { ViewPlugin, ViewUpdate, Decoration } from "@codemirror/view";
import { Facet, StateEffect, Range } from "@codemirror/state";

import { evalEffect } from "./evaluate";

export const flashDuration = Facet.define({
  combine(values: readonly number[]) {
    return values.reduce((a, b) => Math.max(a, b), 200);
  },
});

const endEvalEffect = StateEffect.define<symbol>();

export function evalDecoration() {
  return ViewPlugin.fromClass(
    class {
      decorations = Decoration.none;

      private timers = new Set<number>();

      update({ view, state, transactions }: ViewUpdate) {
        for (let tr of transactions) {
          let flashTime = state.facet(flashDuration);
          this.decorations = this.decorations.map(tr.changes);

          let newDecorations: Range<Decoration>[] = [];
          let oldDecorations = new Set<symbol>();
          for (let effect of tr.effects) {
            if (effect.is(evalEffect) && "from" in effect.value) {
              let { from, to } = effect.value;

              if (from === to) break;

              let id = Symbol();

              let timer: number = window.setTimeout(() => {
                this.timers.delete(timer);
                view.dispatch({ effects: endEvalEffect.of(id) });
              }, flashTime);
              this.timers.add(timer);

              newDecorations.push(
                Decoration.mark({
                  class: "cm-evaluated",
                  id: id,
                }).range(from, to)
              );
            }

            if (effect.is(endEvalEffect)) {
              oldDecorations.add(effect.value);
            }
          }

          this.decorations = this.decorations.update({
            add: newDecorations,
            sort: true,
            filter: (_f, _t, { spec: { id } }) => {
              return !oldDecorations.has(id);
            },
          });
        }
      }

      destroy() {
        for (let timer of this.timers) {
          window.clearTimeout(timer);
        }

        this.timers = new Set();
      }
    },
    { decorations: (v) => v.decorations }
  );
}
