import { EventEmitter } from "@core/events";

import { FromSchema, SettingsSchema, getDefaults, getValid } from "./schema";

interface StateEvents<S extends SettingsSchema> {
  change: FromSchema<S>;
}

export class StateManagement<S extends SettingsSchema> extends EventEmitter<
  StateEvents<S>
> {
  private defaults: FromSchema<S>;
  private data: Partial<FromSchema<S>>;

  constructor(private schema: S, initial: any = {}) {
    super();

    this.defaults = getDefaults(schema);
    this.data = getValid(schema, initial);
  }

  update(data: any) {
    this.data = getValid(this.schema, data);
    this.emit("change", this.getData());
  }

  getData(): FromSchema<S> {
    return { ...this.defaults, ...this.data };
  }
}
