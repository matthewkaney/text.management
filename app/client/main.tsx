let out: (name: string) => WebMidi.MIDIOutput | undefined = () => undefined;

if ("requestMIDIAccess" in navigator) {
  navigator.requestMIDIAccess().then((m) => {
    [...m.outputs.values()].forEach((o) => console.log(o.name));

    out = (n) => [...m.outputs.values()].find(({ name }) => name === n);
  });
}

import { render } from "react-dom";

import { Editor } from "./Editor";
import { Terminal } from "./Terminal";

function App() {
  return (
    <>
      <Editor />
      <Terminal feed={[]} />
    </>
  );
}

window.addEventListener("load", () => {
  render(<App />, document.body);
});
