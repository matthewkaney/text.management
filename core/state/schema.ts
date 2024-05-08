import { JSONSchema, FromSchema as FromJSONSchema } from "json-schema-to-ts";

export interface SettingsSchema {
  properties: Readonly<Record<string, JSONSchema & object>>;
}

export type FromSchema<S extends SettingsSchema> = FromJSONSchema<
  S & { type: "object" }
> &
  object;

export function getDefaults<
  S extends SettingsSchema,
  SchemaData = FromSchema<S>
>(schema: S): SchemaData {
  const defaults: any = {};

  for (let key in schema.properties) {
    let valueOptions = schema.properties[key];

    switch (valueOptions.type) {
      case "number":
        defaults[key] = valueOptions.default ?? 0;
        break;
      case "string":
        defaults[key] = valueOptions.default ?? "";
        break;
      case "boolean":
        defaults[key] = valueOptions.default ?? false;
        break;
      case "array":
        defaults[key] = [];
        break;
    }
  }

  return defaults;
}

export function getValid<S extends SettingsSchema, SchemaData = FromSchema<S>>(
  schema: S,
  data: any
): Partial<SchemaData> {
  const validData: any = {};

  function getValidPrimitive(schema: JSONSchema & object, value: any) {
    if (schema.type === "number" && typeof value === "number") {
      return value;
    } else if (schema.type === "string" && typeof value === "string") {
      return value;
    } else if (schema.type === "boolean" && typeof value === "boolean") {
      return value;
    }
  }

  if (typeof data === "object") {
    for (let key in data) {
      if (key in schema.properties) {
        let prop = schema.properties[key];
        if (
          prop.type === "number" ||
          prop.type === "string" ||
          prop.type === "boolean"
        ) {
          const value = getValidPrimitive(prop, data[key]);
          if (value !== undefined) {
            validData[key] = value;
          }
        } else if (prop.type === "array" && typeof prop.items === "object") {
          const value = data[key];
          if (Array.isArray(value)) {
            const arraySchema = prop.items;
            validData[key] = value.filter((v) =>
              getValidPrimitive(arraySchema, v)
            );
          }
        }
      }
    }
  }

  return validData;
}
