import { useRef, useEffect } from "react";
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTo({
        top: ref.current.scrollHeight - ref.current.clientHeight,
        left: 0,
        behavior: "smooth",
      });
    }
  }, [feed]);

  return (
    <section id="terminal">
      <div id="terminal-contents" ref={ref}>
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

  let lines = text.split("\n").map((lineText, i) => {
    let [, indent, line] = lineText.match(/^(\s*)(.*)/) ?? [];
    let tabLevel = Math.floor(indent.length / 4);
    return (
      <div
        key={i}
        style={{ paddingLeft: `${tabLevel + 2}ch`, textIndent: "-2ch" }}
      >
        {line
          .split("/")
          .flatMap((part, i, arr) =>
            i < arr.length - 1 ? [part, "/", <wbr />] : [part]
          )}
      </div>
    );
  });

  return (
    <div className={clsx("item", level)}>
      <div className="source">{source}</div>
      {lines}
    </div>
  );
}
