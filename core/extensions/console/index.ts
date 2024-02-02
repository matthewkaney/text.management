import "./style.css";

export * from "./types";
import { TerminalMessage } from "./types";

export function console(history: TerminalMessage[] = []) {
  let consoleNode = document.createElement("div");
  consoleNode.classList.add("cm-console");

  consoleNode.setAttribute("role", "log");
  consoleNode.tabIndex = 0;

  for (let message of history) {
    consoleNode.appendChild(messageConstructor(message));
  }

  let visible = true;

  const toggleVisibility = (value?: boolean) => {
    visible = value ?? !visible;

    consoleNode.style.display = visible ? "inherit" : "none";
  };

  return {
    dom: consoleNode,
    update(message: TerminalMessage) {
      let lastElement = consoleNode.appendChild(messageConstructor(message));

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
  messageNode.appendChild(consoleDiv(message.source, "source"));

  const messageContent = messageNode.appendChild(document.createElement("div"));
  messageContent.classList.add("cm-console-message-content");
  if ("input" in message) {
    messageContent.appendChild(consoleDiv(message.input, "input"));
  }
  if (message.output) {
    messageContent.appendChild(consoleDiv(message.output, "output"));
  }
  return messageNode;
}

function consoleDiv(message: string, type: string) {
  const messageSource = document.createElement("div");
  messageSource.classList.add(`cm-console-message-${type}`);
  messageSource.innerText = message;
  return messageSource;
}
