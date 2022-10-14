import { EditorView, showPanel, Panel } from "@codemirror/view";

import { ConsoleMessage, consoleState, consoleMessageEffect } from "./state";

function consolePanelConstructor(view: EditorView): Panel {
  let consoleNode = document.createElement("div");
  consoleNode.classList.add("cm-console");

  for (let message of view.state.field(consoleState, false) || []) {
    consoleNode.appendChild(messageConstructor(message));
  }

  return {
    dom: consoleNode,
    update(update) {
      for (let transaction of update.transactions) {
        for (let effect of transaction.effects) {
          if (effect.is(consoleMessageEffect)) {
            consoleNode.appendChild(messageConstructor(effect.value));
          }
        }
      }
    },
    destroy() {},
  };
}

function messageConstructor(message: ConsoleMessage) {
  const messageNode = document.createElement("div");
  messageNode.classList.add("cm-console-message");
  messageNode.innerText = message.text;
  return messageNode;
}

export const consolePanel = showPanel.of(consolePanelConstructor);
