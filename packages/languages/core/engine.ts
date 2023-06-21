import { EventEmitter } from "@core/events";

export abstract class Engine<T> extends EventEmitter<T> {
  constructor() {
    super();
  }

  abstract send(text: string): Promise<void>;
}
