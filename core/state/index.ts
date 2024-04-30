import { EventEmitter } from "@core/events";

import { SettingsSchema, getDefaults, getValid } from "./schema";

interface StateEvents {
  change: any;
}

export class StateManagement<
  S extends SettingsSchema
> extends EventEmitter<StateEvents> {
  private defaults: any;
  private data: any;

  constructor(private schema: S, initial: any = {}) {
    super();

    this.defaults = getDefaults(schema);
    this.data = getValid(schema, initial);
  }

  update(data: any) {
    this.data = getValid(this.schema, data);
    this.emit("change", this.getData());
  }

  getData() {
    return { ...this.defaults, ...this.data };
  }
}
