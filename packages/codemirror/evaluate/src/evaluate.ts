import { EditorState, StateEffect } from "@codemirror/state";

export const evalEffect = StateEffect.define<{ from: number; to: number }>();
export const commandEffect = StateEffect.define<{
  method: string;
  arg?: any;
}>();

export type evalHandler = (code: string) => void;

export function evalAction(action: evalHandler) {
  return EditorState.transactionExtender.of((tr) => {
    for (let effect of tr.effects) {
      if (effect.is(evalEffect)) {
        let { from, to } = effect.value;
        action(tr.newDoc.sliceString(from, to));
      }
    }

    return null;
  });
}
