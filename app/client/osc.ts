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
