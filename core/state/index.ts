import { Draft, Draft2019 } from "json-schema-library";

import { EventEmitter } from "@core/events";

import { SettingsSchema, FromSchema } from "./schema";

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
  private draft: Draft;
  private _data: D;

  get data() {
    return this._data;
  }

  constructor(schema: S, private parent: Config) {
    super();

    this.draft = new Draft2019({ ...schema, type: "object" });

    this._data = this.getTemplate();

    this.parent.on("change", () => {
      this._data = this.getTemplate();
      this.emit("change", this.data);
    });
  }

  private getTemplate() {
    return this.draft.getTemplate(this.parent.data, undefined, {
      addOptionalProps: false,
    });
  }
}
