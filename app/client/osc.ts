import { message, getMessages } from "../osc/osc";
import { OSCArgumentInputValue, OSCMessage } from "../osc/types";

//let socket = new WebSocket("ws://localhost:4567/");
//socket.binaryType = "arraybuffer";

type OSCHandler = (message: OSCMessage) => any;

const listeners: Map<string, Set<OSCHandler>> = new Map();

type Remote = WebSocket | MessagePort;

let dispatch: (m: Uint8Array) => boolean = () => false;

export function connectRemote(remote: Remote) {
  function handleData({ data }: MessageEvent<Uint8Array>) {
    for (let message of getMessages(data)) {
      let listenersForAddress = listeners.get(message.address);

      if (listenersForAddress) {
        for (let listener of listenersForAddress) {
          listener(message);
        }
      }
    }
  }

  if (remote instanceof WebSocket) {
    dispatch = (m) => {
      if (remote.readyState === remote.OPEN) {
        remote.send(m);
        return true;
      }

      return false;
    };

    remote.addEventListener("message", handleData);

    return () => {
      dispatch = () => false;
      remote.removeEventListener("message", handleData);
    };
  } else if (remote instanceof MessagePort) {
    dispatch = (m) => {
      remote.postMessage(m);
      return true;
    };

    remote.addEventListener("message", handleData);

    remote.start();

    return () => {
      dispatch = () => false;
      remote.removeEventListener("message", handleData);
    };
  }

  throw Error("Unexpected remote type");
}

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
  return dispatch(message(address, ...args));
}
