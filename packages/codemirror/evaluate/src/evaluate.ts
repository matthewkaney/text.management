import {
  EditorState,
  Extension,
  Facet,
  StateEffect,
  Transaction,
} from "@codemirror/state";
import { EditorView } from "@codemirror/view";

class Evaluation {
  constructor(
    readonly code: string,
    readonly span?: { from: number; to: number }
  ) {}
}

export type { Evaluation };

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
        new Evaluation(state.sliceDoc(fromOrCode, to), {
          from: fromOrCode,
          to: to ?? state.doc.length,
        })
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

const evaluationDispatch = EditorView.updateListener.of((update) => {
  for (let tr of update.transactions) {
    for (let effect of tr.effects) {
      if (effect.is(evaluationEffect)) {
        for (let action of tr.state.facet(evaluationAction)) {
          action(effect.value, tr);
        }
      }
    }
  }
});

export const evaluationAction = Facet.define<EvaluationHandler>({
  enables: evaluationDispatch,
});

import { evaluateDecorationPlugin } from "./decoration";

export function evaluation(action?: EvaluationHandler) {
  let extensions: Extension[] = [evaluateDecorationPlugin];

  if (action) {
    extensions.push(evaluationAction.of(action));
  }

  return extensions;
}
