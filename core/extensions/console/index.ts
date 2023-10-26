import { TerminalMessage, Evaluation } from "@core/api";

import "./style.css";

export function console(history: (TerminalMessage | Evaluation)[] = []) {
  let consoleNode = document.createElement("div");
  consoleNode.classList.add("cm-console");

  consoleNode.setAttribute("role", "log");
  consoleNode.tabIndex = 0;

  for (let message of history) {
    consoleNode.appendChild(messageConstructor(format(message)));
  }

  let visible = true;

  const toggleVisibility = (value?: boolean) => {
    visible = value ?? !visible;

    consoleNode.style.display = visible ? "inherit" : "none";
  };

  return {
    dom: consoleNode,
    update(message: TerminalMessage | Evaluation) {
      let lastElement = consoleNode.appendChild(
        messageConstructor(format(message))
      );

      toggleVisibility(true);
      lastElement.scrollIntoView({ behavior: "smooth" });
    },
    toggleVisibility,
    destroy() {},
  };
}

function messageConstructor(message: TerminalMessage) {
  const messageNode = document.createElement("div");
  messageNode.classList.add("cm-console-message");
  messageNode.classList.add(`cm-console-message-${message.level}`);
  messageNode.appendChild(messageSourceConstructor(message));
  messageNode.appendChild(messageContentConstructor(message));
  return messageNode;
}

function messageSourceConstructor(message: TerminalMessage) {
  const messageSource = document.createElement("div");
  messageSource.classList.add("cm-console-message-source");
  messageSource.innerText = message.source;
  return messageSource;
}

function messageContentConstructor(message: TerminalMessage) {
  const messageContent = document.createElement("div");
  messageContent.classList.add("cm-console-message-content");
  messageContent.innerText = message.text;
  return messageContent;
}

function format(message: TerminalMessage | Evaluation): TerminalMessage {
  if ("level" in message) {
    return message;
  } else {
    let { input, success, result } = message;
    return {
      level: success ? "info" : "error",
      source: "Tidal",
      text: `> ${input}${typeof result === "string" ? `\n\n${result}` : ""}`,
    };
  }
}
