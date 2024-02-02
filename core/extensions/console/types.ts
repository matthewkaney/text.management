import { Evaluation, Log } from "@core/api";

export type TerminalMessage = {
  source: string;
  level: "info" | "error";
} & (
  | {
      input: string;
      output?: string;
    }
  | { output: string }
);

export function toTerminalMessage(
  message: Evaluation | Log,
  source: string
): TerminalMessage {
  if ("input" in message) {
    let { input, success, output } = message;
    return { source, level: success ? "info" : "error", input, output };
  } else {
    let { level, output } = message;
    return { source, level, output };
  }
}
