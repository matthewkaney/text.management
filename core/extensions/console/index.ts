import { ConsoleMessage } from "@management/cm-console";

import { TerminalMessage } from "@core/api";

import "./style.css";

export function console(history: TerminalMessage[] = []) {
  let consoleNode = document.createElement("div");
  consoleNode.classList.add("cm-console");

  consoleNode.setAttribute("role", "log");
  consoleNode.tabIndex = 0;

  for (let message of history) {
    consoleNode.appendChild(messageConstructor(message));
  }

  return {
    dom: consoleNode,
    update(message: TerminalMessage) {
      let lastElement = consoleNode.appendChild(messageConstructor(message));

      lastElement.scrollIntoView({ behavior: "smooth" });
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
