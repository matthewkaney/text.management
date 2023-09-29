import { EditorView, showPanel, Panel } from "@codemirror/view";

import { ConsoleMessage, consoleState, consoleMessageEffect } from "./state";

// Shim for hiding from screen reader for now...
import { StateField } from "@codemirror/state";

export const inaccessibleConsole = StateField.define({
  create: () => true,
  update: (v) => v,
});

function consolePanelConstructor(view: EditorView): Panel {
  let consoleNode = document.createElement("div");
  consoleNode.classList.add("cm-console");

  if (!view.state.field(inaccessibleConsole, false)) {
    consoleNode.setAttribute("role", "log");
    consoleNode.tabIndex = 0;
  }

  for (let message of view.state.field(consoleState, false) || []) {
    consoleNode.appendChild(messageConstructor(message));
  }

  return {
    dom: consoleNode,
    update(update) {
      let lastElement: HTMLElement | null = null;
      for (let transaction of update.transactions) {
        for (let effect of transaction.effects) {
          if (effect.is(consoleMessageEffect)) {
            lastElement = consoleNode.appendChild(
              messageConstructor(effect.value)
            );
          }
        }
      }

      if (lastElement) {
        lastElement.scrollIntoView({ behavior: "smooth" });
      }
    },
    destroy() {},
  };
}

function messageConstructor(message: ConsoleMessage) {
  const messageNode = document.createElement("div");
  messageNode.classList.add("cm-console-message");
  messageNode.classList.add(`cm-console-message-${message.level}`);
  messageNode.appendChild(messageSourceConstructor(message));
  messageNode.appendChild(messageContentConstructor(message));
  return messageNode;
}

function messageSourceConstructor(message: ConsoleMessage) {
  const messageSource = document.createElement("div");
  messageSource.classList.add("cm-console-message-source");
  messageSource.innerText = message.source;
  return messageSource;
}

function messageContentConstructor(message: ConsoleMessage) {
  const messageContent = document.createElement("div");
  messageContent.classList.add("cm-console-message-content");
  messageContent.innerText = message.text;
  return messageContent;
}

export const consolePanel = showPanel.from(consoleState, (messages) =>
  messages.length ? consolePanelConstructor : null
);
