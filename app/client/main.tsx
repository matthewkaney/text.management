import { useState, useEffect } from "react";
import { render } from "react-dom";

import { listenForOSC } from "./osc";
import { playMIDI } from "./midi";

import { Editor } from "./editor";
import { Terminal, TerminalMessage } from "./Terminal";

function App() {
  const [feed, setFeed] = useState<TerminalMessage[]>([]);

  useEffect(() => {
    return listenForOSC("/tidal/reply", ({ args: [text] }) => {
      if (typeof text === "string") {
        setFeed((f) => [...f, { level: "log", source: "tidal", text }]);
      }
    });
  }, []);

  useEffect(() => {
    return listenForOSC("/tidal/error", ({ args: [text] }) => {
      if (typeof text === "string") {
        setFeed((f) => [...f, { level: "error", source: "tidal", text }]);
      }
    });
  }, []);

  useEffect(() => {
    return listenForOSC("/midi/play", playMIDI);
  }, []);

  return (
    <>
      <Editor />
      <Terminal feed={feed} />
    </>
  );
}

window.addEventListener("load", () => {
  render(<App />, document.body);
});
