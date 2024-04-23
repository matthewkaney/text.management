import { StateField, StateEffect } from "@codemirror/state";
import { EditorView, Panel, showPanel } from "@codemirror/view";

import { TerminalMessage } from ".";

import { console as baseConsole } from ".";

export function console(history?: TerminalMessage[]) {
  return showPanel.from(consoleState, (messages) =>
    messages.length ? ConsolePanel : null
  );
}

function ConsolePanel({ state }: EditorView): Panel {
  const { dom, update, destroy } = baseConsole(
    state.field(consoleState, false)
  );

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
        window.console.log("State, Console Effect");
        window.console.log(effect.value);
        value = [...value, effect.value];
      }
    }

    return value;
  },
});
