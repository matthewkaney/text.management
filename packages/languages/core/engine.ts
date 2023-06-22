import { EventEmitter, EventMap } from "@core/events";

export abstract class Engine<T extends EventMap> extends EventEmitter<T> {
  constructor() {
    super();
  }

  abstract send(text: string): Promise<void>;
}
