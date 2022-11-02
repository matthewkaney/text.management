import { useState, useEffect } from "react";
import { render } from "react-dom";

import { Editor } from "./editor";
import { Terminal, TerminalMessage } from "./Terminal";

import { child, onChildAdded } from "firebase/database";
import { session } from "./currentSession";

function App() {
  const [feed, setFeed] = useState<TerminalMessage[]>([]);

  useEffect(() => {
    let cancelled = false;
    let noListener = () => {};

    session.then((s) => {
      onChildAdded(child(s.ref, "console"), (child) => {
        setFeed((f) => [...f, child.val() as TerminalMessage]);
      });
    });

    return () => {
      cancelled = true;
      noListener();
    };
  }, []);

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
