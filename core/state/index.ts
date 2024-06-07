import { JSONSchema } from "json-schema-to-ts";

import { EventEmitter } from "@core/events";

export * from "./schema";
import { SettingsSchema, FromSchema } from "./schema";
import { normalize } from "./template";

interface ConfigEvents<T> {
  change: T;
}

export class Config extends EventEmitter<ConfigEvents<any>> {
  private _data: any = {};

  get data() {
    return this._data;
  }

  update(data: any) {
    this._data = data;
    this.emit("change", data);
  }

  extend<S extends SettingsSchema, D = FromSchema<S>>(
    schema: S
  ): ConfigExtension<S, D> {
    return new ConfigExtension(schema, this);
  }
}

export type { ConfigExtension };

class ConfigExtension<
  S extends SettingsSchema,
  D = FromSchema<S>
> extends EventEmitter<ConfigEvents<D>> {
  private schema: JSONSchema;
  private _data: D;

  get data() {
    return this._data;
  }

  constructor(schema: S, private parent: Config) {
    super();

    this.schema = { ...schema, type: "object" };

    this._data = this.getTemplate();

    this.parent.on("change", () => {
      this._data = this.getTemplate();
      this.emit("change", this.data);
    });
  }

  private getTemplate() {
    return normalize(this.schema, this.parent.data);
  }
}
