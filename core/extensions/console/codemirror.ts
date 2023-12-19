import { StateField, StateEffect } from "@codemirror/state";
import { Panel, showPanel } from "@codemirror/view";

import { TerminalMessage } from "@core/api";

import { console as baseConsole } from ".";

export function console(history?: TerminalMessage[]) {
  return showPanel.of(ConsolePanel);
}

function ConsolePanel(): Panel {
  const { dom, update, destroy } = baseConsole();

  return {
    dom,
    update: ({ transactions }) => {
      for (let { effects } of transactions) {
        for (let effect of effects) {
          if (effect.is(consoleMessageEffect)) {
            update(effect.value);
          }
        }
      }
    },
    destroy,
  };
}

export const consoleMessageEffect = StateEffect.define<TerminalMessage>();

export const consoleState = StateField.define<TerminalMessage[]>({
  create: () => {
    return [];
  },

  update: (value, transaction) => {
    for (let effect of transaction.effects) {
      if (effect.is(consoleMessageEffect)) {
        value = [...value, effect.value];
      }
    }

    return value;
  },
});
