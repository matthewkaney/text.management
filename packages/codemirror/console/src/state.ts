import { EditorView } from "@codemirror/view";
import { StateField, StateEffect, EditorState } from "@codemirror/state";

export interface ConsoleMessage {
  level: "info" | "warn" | "error";
  source: string;
  text: string;
}

export function clearConsole({ dispatch }: EditorView) {
  dispatch({ effects: consoleClearEffect.of() });
  return true;
}

export function sendToConsole(state: EditorState, message: ConsoleMessage) {
  let effects: StateEffect<unknown>[] = [consoleMessageEffect.of(message)];

  if (!state.field(consoleState, false)) {
    effects.push(StateEffect.appendConfig.of(consoleState));
  }

  return state.update({ effects });
}

export const consoleMessageEffect = StateEffect.define<ConsoleMessage>();

const consoleClearEffect = StateEffect.define<void>();

export const consoleState = StateField.define<ConsoleMessage[]>({
  create: () => {
    return [];
  },

  update: (value, transaction) => {
    for (let effect of transaction.effects) {
      if (effect.is(consoleMessageEffect)) {
        value = [...value, effect.value];
      } else if (effect.is(consoleClearEffect)) {
        value = [];
      }
    }

    return value;
  },
});
