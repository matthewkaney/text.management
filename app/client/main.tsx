import { useState, useEffect } from "react";
import { render } from "react-dom";

import { listenForOSC } from "./osc";
import { playMIDI } from "./midi";

import { Editor } from "./editor";
import { Terminal, TerminalMessage } from "./Terminal";

function App() {
  const [feed, setFeed] = useState<TerminalMessage[]>([]);

  useEffect(() => {
    return listenForOSC("/tidal/reply", ({ args: [text], time }) => {
      console.log(time);
      if (typeof text === "string") {
        setFeed((f) => [...f, { level: "log", source: "tidal", text, time }]);
      }
    });
  }, []);

  useEffect(() => {
    return listenForOSC("/tidal/error", ({ args: [text], time }) => {
      if (typeof text === "string") {
        setFeed((f) => [...f, { level: "error", source: "tidal", text, time }]);
      }
    });
  }, []);

  useEffect(() => {
    return listenForOSC("/midi/play", playMIDI);
  }, []);

  const [lastDeleted, setLastDeleted] = useState(0);

  useEffect(() => {
    if (feed.length > 0) {
      let { time } = feed[0];
      let deletionTime = Math.max(lastDeleted + 500, time + 8000);
      let timer = setTimeout(() => {
        setLastDeleted(deletionTime);
        setFeed((f) => f.slice(1));
      }, deletionTime - performance.now());

      return () => {
        clearTimeout(timer);
      };
    }
  }, [feed, lastDeleted]);

  return (
    <>
      <Editor />
      {feed.length > 0 && <Terminal feed={feed} />}
    </>
  );
}

window.addEventListener("load", () => {
  render(<App />, document.body);
});
