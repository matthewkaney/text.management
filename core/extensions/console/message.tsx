import { render } from "nano-jsx";
import { clsx } from "clsx/lite";

import { Evaluation, Log } from "@core/api";

import { InputIcon, OutputIcon, ErrorIcon } from "./icons";

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

export function messageConstructor(rawMessage: Evaluation | Log) {
  let message = format(rawMessage);

  return render(
    <div
      class={clsx("cm-console-message", `cm-console-message-${message.level}`)}
    >
      <div class="cm-console-message-source">{message.source}</div>
      <div class="cm-console-message-content">
        {"input" in message && (
          <div class="cm-console-message-input">
            <InputIcon />
            {message.input}
          </div>
        )}
        {message.output && (
          <div class="cm-console-message-output">
            {message.level === "info" ? <OutputIcon /> : <ErrorIcon />}
            {message.output}
          </div>
        )}
      </div>
    </div>
  );
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
