import { message, getMessages } from "../osc/osc";
import { OSCArgumentInputValue, OSCMessage } from "../osc/types";

type OSCHandler = (message: OSCMessage) => any;

const listeners: Map<string, Set<OSCHandler>> = new Map();

type Remote = WebSocket | MessagePort;

let dispatch: (m: Uint8Array) => void = () => {};

let socket = new WebSocket(`ws://${window.location.host}/`);
socket.binaryType = "arraybuffer";
connectRemote(socket);

export function connectRemote(remote: Remote) {
  function handleData({ data }: MessageEvent) {
    if (data instanceof ArrayBuffer) {
      data = new Uint8Array(data);
    }

    if (!(data instanceof Uint8Array)) {
      throw Error("Unrecognized data type");
    }

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
      } else {
        remote.addEventListener("open", () => {
          remote.send(m);
        });
      }
    };

    remote.addEventListener("message", handleData);

    return () => {
      dispatch = () => false;
      remote.removeEventListener("message", handleData);
    };
  } else if (remote instanceof MessagePort) {
    dispatch = (m) => {
      remote.postMessage(m);
    };

    remote.addEventListener("message", handleData);

    remote.start();

    return () => {
      dispatch = () => {};
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
  dispatch(message(address, ...args));
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
