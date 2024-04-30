import rfdc from "rfdc";

import { EventEmitter } from "@core/events";

import { SettingsSchema } from "./schema";

const clone = rfdc();

interface StateEvents<T extends SettingsSchema> {
  change: Required<FromSchema<T>>;
}

class StateManagement<S extends SettingsSchema> extends EventEmitter<
  StateEvents<S>
> {
  private data: FromSchema<S>;

  // constructor(private spec: S, initial: Partial<FromSchema<S>> = {}) {
  //   super();

  //   this.data = clone(initial);
  // }
}
