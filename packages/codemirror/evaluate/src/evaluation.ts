import { EditorState } from "@codemirror/state";

import { evaluate } from "./highlight";

export function evalHandler(action: (code: string) => void) {
  return EditorState.transactionExtender.of((tr) => {
    for (let effect of tr.effects) {
      if (effect.is(evaluate)) {
        let { from, to } = effect.value;
        action(tr.newDoc.sliceString(from, to));
      }
    }

    return null;
  });
}
