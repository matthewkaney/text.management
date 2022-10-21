import {
  OSCArgumentValue,
  OSCArgumentValueList,
  OSCMessage,
} from "../osc/types";

// MIDI player
let out: (name: string) => WebMidi.MIDIOutput | undefined = () => undefined;

if ("requestMIDIAccess" in navigator) {
  navigator.requestMIDIAccess().then((m) => {
    [...m.outputs.values()].forEach((o) => console.log(o.name));

    out = (n) => [...m.outputs.values()].find(({ name }) => name === n);
  });
}

export function playMIDI({ time, args }: OSCMessage) {
  let params: { [k: string]: OSCArgumentValueList | OSCArgumentValue } = {};

  while (args.length >= 2) {
    let key, val;
    [key, val, ...args] = args;

    if (typeof key === "string") {
      params[key] = val;
    }
  }

  if (typeof params.d === "string") {
    if (typeof params.delta === "number" && typeof params.n === "number") {
      let delta = params.delta * 1000;
      let note = params.n + 60;
      let vel = typeof params.vel === "number" ? params.vel : 80;
      let chan = typeof params.chan === "number" ? params.chan : 0;

      out(params.d)?.send([0x90 | chan, note, vel], time);
      out(params.d)?.send([0x80 | chan, note, 0], time + delta);
    }
  }
}
