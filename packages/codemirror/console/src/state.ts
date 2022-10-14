import { StateField, StateEffect } from "@codemirror/state";

export interface ConsoleMessage {
  level: "info" | "warn" | "error";
  source: string;
  text: string;
}

export const consoleMessageEffect = StateEffect.define<ConsoleMessage>();

export const consoleState = StateField.define<ConsoleMessage[]>({
  create: () => {
    return [];
  },

  update: (value, transaction) => {
    for (let effect of transaction.effects) {
      if (effect.is(consoleMessageEffect)) {
        return [...value, effect.value];
      }
    }

    return value;
  },
});
