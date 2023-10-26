import { JSONSchema7, FromSchema } from "json-schema-to-ts";

export interface SettingsSchema {
  [name: string]: JSONSchema7;
}

export function getSettings<S extends JSONSchema7>(
  schema: S,
  data: unknown
): Required<FromSchema<S>> {
  let settings: { [name: string]: any } = {};

  if (typeof schema === "object" && "properties" in schema) {
    for (let name in schema.properties) {
      if (typeof data === "object" && data && name in data) {
        settings[name] = (data as any)[name];
      } else {
        let settingSchema = schema.properties[name];

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
  }

  return settings as any;
}
