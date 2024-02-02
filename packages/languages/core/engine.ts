import { Evaluation } from "@core/api";
import { EventEmitter, EventMap } from "@core/events";

interface EngineEvents {
  started: undefined;
  stopped: undefined;
}

export abstract class Engine<T extends EventMap> extends EventEmitter<
  T & EngineEvents
> {
  constructor() {
    super();
  }

  abstract send(text: string): AsyncGenerator<Evaluation>;

  abstract restart(): Promise<void>;
}
