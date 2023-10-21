import { JSONSchema7, FromSchema } from "json-schema-to-ts";

export interface SettingsSchema {
  [name: string]: JSONSchema7;
}

export function asJSONSchema(schema: SettingsSchema) {
  return {
    type: "object",
    properties: schema,
  } as const;
}

export function getSettings<S extends JSONSchema7>(
  schema: S,
  data: unknown
): FromSchema<S> {
  let settings: { [name in keyof S]?: S[name] } = {};

  for (let name in (schema as any).properties) {
    if (typeof data === "object" && data && name in data) {
      settings[name] = (data as any)[name];
    } else {
      let settingSchema = schema[name];

      if (typeof settingSchema === "boolean") {
        throw Error("Unexpected boolean JSON schema");
      }

      let value = settingSchema.default;

      if (value === undefined) {
        if (settingSchema.type === "array") {
          value = [];
        }
      }

      settings[name] = value as any;
    }
  }

  return settings as any;
}
