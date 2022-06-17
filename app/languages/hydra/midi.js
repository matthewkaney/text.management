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

export function cc(num, low, high) {
  if (high === undefined) {
    if (low === undefined) {
      low = 0;
      high = 1;
    } else {
      high = low;
      low = 0;
    }
  }

  return () => {
    return cc_list[num] * (high - low) + low;
  };
}

// Current tick counter
let current_tick = 0;

export function currentTick() {
  return current_tick;
}

function getMIDIMessage({ data }) {
  console.log(`Received midi: ${JSON.stringify(data)}`);
  if (data[0] === 0xf8) {
    // MIDI Clock
    current_tick += 1;
  } else if (data[0] === 0xfa) {
    // MIDI Start
    current_tick = -1;
  } else if (data[0] === 0xfb) {
    // MIDI Continue
  } else if (data[0] === 0xfc) {
    // MIDI Stop
  } else if ((data[0] & 0xf0) === 0xb0) {
    cc_list[data[1]] = data[2] / 127;
  }
}
