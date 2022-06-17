// register WebMIDI
navigator.requestMIDIAccess().then(
  (midiAccess) => {
    console.log(midiAccess);
    for (var input of midiAccess.inputs.values()) {
      input.onmidimessage = getMIDIMessage;
    }
  },
  () => {
    console.log("Could not access your MIDI devices.");
  }
);

//create an array to hold our cc values and init to a normalized value
var cc_list = Array(128).fill(0.5);

function getMIDIMessage({ data }) {
  console.log(`Received midi: ${JSON.stringify(data)}`);
  if (data[0] === 0xf8) {
    // MIDI Clock
  } else if (data[0] === 0xfa) {
    // MIDI Start
  } else if (data[0] === 0xfb) {
    // MIDI Continue
  } else if (data[0] === 0xfc) {
    // MIDI Stop
  } else if ((data[0] & 0xf0) === 0xb0) {
    cc_list[data[1]] = data[2] / 127;
  }
}

export function cc(num, low, high) {
  if (high === undefined) {
    high = low === undefined ? 1 : low;
    low = low || 0;
  }

  return cc_list[num] * (high - low) + low;
}
