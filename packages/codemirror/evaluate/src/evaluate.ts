import {
  EditorState,
  Facet,
  StateEffect,
  Transaction,
} from "@codemirror/state";
import { ViewPlugin } from "@codemirror/view";

class Evaluation {
  constructor(
    readonly code: string,
    readonly span?: { from: number; to: number }
  ) {}
}

export function evaluate(
  state: EditorState,
  from: number,
  to?: number
): Transaction;
export function evaluate(state: EditorState, code: string): Transaction;
export function evaluate(
  state: EditorState,
  fromOrCode: number | string,
  to?: number
) {
  if (typeof fromOrCode === "string") {
    return state.update({
      effects: evaluationEffect.of(new Evaluation(fromOrCode)),
    });
  } else {
    return state.update({
      effects: evaluationEffect.of(
        new Evaluation(state.sliceDoc(fromOrCode, to))
      ),
    });
  }
}

export type EvaluationSpec =
  | { from: number; to: number; code: string }
  | { from: number; to: number }
  | { code: string };

export const evaluationEffect = StateEffect.define<Evaluation>();

export type EvaluationHandler = (
  evaluation: Evaluation,
  origin: Transaction
) => void;

const evaluationDispatch = ViewPlugin.define(() => ({
  update: (update) => {
    for (let tr of update.transactions) {
      for (let effect of tr.effects) {
        if (effect.is(evaluationEffect)) {
          for (let action of tr.state.facet(evaluationAction)) {
            action(effect.value, tr);
          }
        }
      }
    }
  },
}));

const evaluationAction = Facet.define<EvaluationHandler>({
  enables: evaluationDispatch,
});

import { evalDecoration, evalTheme } from "./decoration";

export function evaluation(action?: EvaluationHandler) {
  let extensions = [evalDecoration(), evalTheme, keymap.of(evalKeymap)];
  if (action) extensions.push(evalAction.of(action));
  return extensions;
}
