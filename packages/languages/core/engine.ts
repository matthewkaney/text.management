import { EventEmitter, EventMap } from "@core/events";

interface EngineEvents {
  started: undefined;
  stopped: undefined;
}

type Extending<Child extends EventMap, Parent extends EventMap> = {
  [K in keyof Child as K extends keyof Parent ? never : K]: Child[K];
};

export abstract class Engine<
  T extends Extending<T, EngineEvents>
> extends EventEmitter<T & EngineEvents> {
  constructor() {
    super();

    this._status = "starting";

    // this.init().then(() => {
    //   this._status = "running";
    // });
  }

  private _status: "starting" | "running" | "stopping" | "stopped";

  get status() {
    return this._status;
  }

  // abstract init(): Promise<void>;

  abstract send(text: string): Promise<void>;

  abstract close(): Promise<void>;

  abstract restart(): Promise<void>;
}
