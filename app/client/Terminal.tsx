export interface TerminalMessage {
  level: "log" | "error";
  source: string;
  text: string;
}

interface TerminalProps {
  feed: TerminalMessage[];
}

export function Terminal({ feed }: TerminalProps) {
  return (
    <section id="terminal">
      <div id="terminal-contents"></div>
    </section>
  );
}
