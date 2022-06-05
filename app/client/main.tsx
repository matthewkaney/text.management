import { useState, useEffect, useMemo } from "react";
import { render } from "react-dom";

import { message } from "../osc/osc";
import { listenForOSC } from "./osc";
import { playMIDI } from "./midi";

import { Editor } from "./editor";
import { Terminal, TerminalMessage } from "./Terminal";

import { HydraCanvas } from "./hydra";

function App() {
  const channel = useMemo(() => new MessageChannel(), []);

  useEffect(() => {
    function respond(event: MessageEvent) {
      console.log(event);
    }

    channel.port1.addEventListener("message", respond);
    channel.port1.start();

    return () => {
      channel.port1.removeEventListener("message", respond);
    };
  }, [channel]);

  const [feed, setFeed] = useState<TerminalMessage[]>([]);

  useEffect(() => {
    return listenForOSC("/tidal/reply", ({ args: [text], time }) => {
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
      <Editor
        onEval={(c) => {
          console.log(c);
          channel.port1.postMessage(message("/code", c));
        }}
      />
      {feed.length > 0 && <Terminal feed={feed} />}
      <HydraCanvas channel={channel} />
    </>
  );
}

window.addEventListener("load", () => {
  render(<App />, document.body);
});
