import { createSocket } from "dgram";

import { parse } from "@core/osc/osc";
import { asMessages } from "@core/osc/utils";
import { OSCMessage } from "@core/osc/types";

export type MessageHandler = (message: OSCMessage) => void;
export type EventDisconnect = () => void;

export class OSCSocket {
  private listeners: { [address: string]: MessageHandler[] } = {};

  private socket = createSocket("udp4");

  readonly bound: Promise<void>;

  constructor(port: number, remotePort?: number) {
    this.bound = new Promise((resolve) =>
      this.socket.bind(port, "localhost", () => {
        resolve();
      })
    );

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

  await(event: string, signal?: AbortSignal): Promise<OSCMessage> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(signal.reason);
        return;
      }

      const unsubscribe = this.once(event, (value) => {
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
