import clsx from "clsx";

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
      <div id="terminal-contents">
        {feed.map((message) => (
          <TerminalItem message={message} />
        ))}
      </div>
    </section>
  );
}

interface TerminalItemProps {
  message: TerminalMessage;
}

function TerminalItem({ message }: TerminalItemProps) {
  let { level, source, text } = message;
  return (
    <div className={clsx("item", level)}>
      <div className="source">{source}</div>
      {text}
    </div>
  );
}
