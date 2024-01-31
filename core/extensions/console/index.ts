import { Evaluation, Log } from "@core/api";

import "./style.css";

type TerminalMessage = {
  source: string;
  level: "info" | "error";
} & (
  | {
      input: string;
      output?: string;
    }
  | { output: string }
);

export function console(history: (Evaluation | Log)[] = []) {
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
    update(message: Evaluation | Log) {
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

function format(message: Evaluation | Log): TerminalMessage {
  if ("input" in message) {
    let { input, success, text } = message;
    return {
      source: "Tidal",
      level: success ? "info" : "error",
      input,
      output: text,
    };
  } else {
    let { level, text } = message;
    return {
      source: "Tidal",
      level,
      output: text,
    };
  }
}
