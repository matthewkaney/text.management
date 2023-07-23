import { EditorState, Facet, StateEffect } from "@codemirror/state";

export type Evaluation =
  | { from: number; to: number; code: string }
  | { from: number; to: number }
  | { code: string };
export const evalEffect = StateEffect.define<Evaluation>();

export type EvaluationHandler = (
  evaluation: Evaluation & { code: string }
) => void;

export const evalActions = Facet.define<EvaluationHandler>({
  enables: EditorState.transactionExtender.of((tr) => {
    for (let effect of tr.effects) {
      if (effect.is(evalEffect)) {
        for (let action of tr.startState.facet(evalActions)) {
          if (!("code" in effect.value)) {
            let { from, to } = effect.value;
            let code = tr.newDoc.sliceString(from, to);
            action({ from, to, code });
          } else {
            action(effect.value);
          }
        }
      }
    }

    return null;
  }),
});
