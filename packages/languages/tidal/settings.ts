import type { JSONSchema, FromSchema } from "json-schema-to-ts";

export const TidalSettingsSchema = {
  type: "object",
  properties: {
    environment: { const: "ghci" },
    "boot.useDefaultFile": { type: "boolean", default: true },
    "boot.customFiles": { type: "array", items: { type: "string" } },
    "boot.disableEditorIntegration": { type: "boolean", default: false },
  },
  additionalProperties: false,
} as const satisfies JSONSchema;

export type TidalSettings = Required<FromSchema<typeof TidalSettingsSchema>>;

function normalizeSettings<S extends JSONSchema>(
  typedSchema: S,
  settings: unknown
) {
  let completeSettings: any = {};

  let schema = typedSchema as any;

  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    // This shouldn't be necessary if schema has a specific type
    if (typeof propSchema !== "object" || propSchema === null) break;

    if (typeof settings === "object" && settings && propName in settings) {
      // TODO: Validate

      completeSettings[propName] = (settings as { [key: string]: unknown })[
        propName
      ];

      continue;
    }

    if ("const" in propSchema) {
      completeSettings[propName] = propSchema.const;
    } else if ("default" in propSchema) {
      completeSettings[propName] = propSchema.default;
    } else if ("type" in propSchema && propSchema.type === "array") {
      completeSettings[propName] = [];
    } else {
      throw Error(
        `No way to generate a default value for settings property "${propName}"`
      );
    }
  }

  return completeSettings as Required<FromSchema<S>>;
}

export function normalizeTidalSettings(settings: unknown) {
  return normalizeSettings(TidalSettingsSchema, settings);
}
