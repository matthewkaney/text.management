import { createSocket } from "dgram";

import { parse } from "@core/osc/osc";
import { asMessages } from "@core/osc/utils";
import { OSCMessage } from "@core/osc/types";

export type MessageHandler = (message: Required<OSCMessage>) => void;
export type EventDisconnect = () => void;

export class OSCSocket {
  private listeners: { [address: string]: MessageHandler[] } = {};

  private socket = createSocket("udp4");

  readonly port: Promise<number>;
  readonly bound: Promise<void>;

  constructor(port: number, remotePort?: number) {
    const { promise: portPromise, resolve: portResolve } =
      Promise.withResolvers<number>();

    const { promise: boundPromise, resolve: boundResolve } =
      Promise.withResolvers<void>();

    this.port = portPromise;
    this.bound = boundPromise;

    this.socket.bind(port, "localhost", () => {
      portResolve(this.socket.address().port);
      boundResolve();
    });

    if (remotePort) {
      this.socket.connect(remotePort);
    }

    this.socket.on("message", (data) => {
      for (let message of asMessages(parse(data))) {
        console.log(`OSC: ${message.address} ${JSON.stringify(message.args)}`);
        if (message.address in this.listeners) {
          for (let handler of this.listeners[message.address]) {
            handler(message);
          }
        }
      }
    });
  }

  on(address: string, handler: MessageHandler) {
    let listeners: MessageHandler[];

    let maybeListeners = this.listeners[address];

    if (maybeListeners) {
      listeners = maybeListeners;
    } else {
      listeners = this.listeners[address] = [];
    }

    listeners.push(handler);

    return () => {
      let index = listeners.indexOf(handler);
      if (index != -1) {
        listeners.splice(index, 1);
      }
    };
  }

  once(address: string, handler: MessageHandler): EventDisconnect {
    let disconnect = this.on(address, (message) => {
      handler(message);
      disconnect();
    });

    return disconnect;
  }

  await(address: string, signal?: AbortSignal): Promise<Required<OSCMessage>> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(signal.reason);
        return;
      }

      const unsubscribe = this.once(address, (value) => {
        resolve(value);
      });

      signal?.addEventListener("abort", () => {
        unsubscribe();
        reject(signal.reason);
      });
    });
  }

  send(packet: Buffer) {
    this.socket.send(packet);
  }
}
