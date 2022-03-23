import { message, getMessages } from "../osc/osc";
import { OSCArgumentInputValue, OSCMessage } from "../osc/types";

let socket = new WebSocket(`ws://${window.location.host}/`);
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
  const send = () => {
    socket.send(message(address, ...args));
  };

  if (socket.readyState === socket.OPEN) {
    send();
    return true;
  } else {
    socket.addEventListener("open", send);
    return false;
  }
}

export function sendOSCWithResponse(
  [address, ...args]: [string, ...OSCArgumentInputValue[]],
  response: string
): Promise<OSCMessage> {
  return new Promise((resolve) => {
    const unlisten = listenForOSC(response, (message) => {
      unlisten();
      resolve(message);
    });

    sendOSC(address, ...args);
  });
}
