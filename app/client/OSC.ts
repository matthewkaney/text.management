import { message, getMessages } from "../osc/osc";
import { OSCArgumentInputValue, OSCMessage } from "../osc/types";

let socket = new WebSocket("ws://localhost:4567/");
socket.binaryType = "arraybuffer";

type OSCHandler = (message: OSCMessage) => any;

const listeners: Map<string, Set<OSCHandler>> = new Map();

socket.addEventListener("message", ({ data }) => {
  let messageList = getMessages(new Uint8Array(data));

  for (let message of messageList) {
    let listenersForAddress = listeners.get(message.address);

    if (listenersForAddress) {
      for (let listener of listenersForAddress) {
        listener(message);
      }
    }
  }
});

// OLD Listener Behavior...
//     if (
//       (address === "/tidal/reply" || address === "/tidal/error") &&
//       typeof args[0] === "string"
//     ) {
//       const element = document.createElement("div");
//       element.innerText = args[0];
//       element.classList.add("item");
//       document.getElementById("terminal-contents")?.appendChild(element);
//       element.scrollIntoView(false);
//     } else if (address === "/midi/play") {
//       let params: { [k: string]: any } = {};

//       while (args.length >= 2) {
//         let key, val;
//         [key, val, ...args] = args;

//         if (typeof key === "string") {
//           params[key] = val;
//         }
//       }

//       console.log(params);

//       if (typeof params.d === "string") {
//         if (typeof params.delta === "number" && typeof params.n === "number") {
//           let delta = params.delta * 1000;
//           let note = params.n + 60;
//           let vel = typeof params.vel === "number" ? params.vel : 80;
//           let chan = typeof params.chan === "number" ? params.chan : 0;

//           let time = ntpTime ? ntpToTimestamp(...ntpTime) : performance.now();

//           out(params.d)?.send([0x90 | chan, note, vel], time);
//           out(params.d)?.send([0x80 | chan, note, 0], time + delta);
//         }
//       }
//     }
//   }
// });

export function listenForOSC(address: string, callback: OSCHandler) {
  if (!listeners.has(address)) {
    listeners.set(address, new Set());
  }

  listeners.get(address)?.add(callback);

  return () => {
    listeners.get(address)?.delete(callback);

    if (listeners.get(address)?.size === 0) {
      listeners.delete(address);
    }
  };
}

export function sendOSC(address: string, ...args: OSCArgumentInputValue[]) {
  if (socket.readyState === socket.OPEN) {
    socket.send(message(address, ...args));
    return true;
  }

  return false;
}
