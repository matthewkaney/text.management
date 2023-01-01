import { EventEmitter } from "@core/events";

export class Engine<T> extends EventEmitter<T> {
  constructor() {
    super();
  }
}
