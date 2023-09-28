import type { JSONSchema, FromSchema } from "json-schema-to-ts";

export const TidalSettingsSchema = {
  type: "object",
  properties: {
    environment: { const: "ghci" },
    "boot.useDefaultFile": { type: "boolean", default: true },
    "boot.customFiles": { type: "array", items: { type: "string" } },
  },
  additionalProperties: false,
} as const satisfies JSONSchema;

export type TidalSettings = Required<FromSchema<typeof TidalSettingsSchema>>;

export function normalizeSettings<S extends JSONSchema>(
  typedSchema: S,
  settings: unknown
) {
  let completeSettings: any = {};

  let schema = typedSchema as any;

  for (let [propName, propSchema] of Object.entries(schema.properties)) {
    // This shouldn't be necessary if schema has a specific type
    if (typeof propSchema !== "object" || propSchema === null) break;

    if ("const" in propSchema) {
      defaultSettings[propName] = propSchema.const;
    } else if ("default" in propSchema) {
      defaultSettings[propName] = propSchema.default;
    } else if ("type" in propSchema && propSchema.type === "array") {
      defaultSettings[propName] = [];
    } else {
      throw Error(
        `No way to generate a default value for settings property "${propName}"`
      );
    }
  }

  return defaultSettings as Required<FromSchema<S>>;
}

export const defaultSettings = generateDefaultSettings(TidalSettingsSchema);
