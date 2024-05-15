import { JSONSchema, FromSchema as FromJSONSchema } from "json-schema-to-ts";

export interface SettingsSchema {
  properties: Readonly<Record<string, JSONSchema & object>>;
}

export type FromSchema<S extends SettingsSchema> = FromJSONSchema<
  S & { type: "object" }
> &
  object;
