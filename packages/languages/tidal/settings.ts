import { JSONSchema7, FromSchema } from "json-schema-to-ts";

export const TidalSettingsSchema = {
  type: "object",
  properties: {
    // environment: { const: "ghci" },
    "tidal.boot.useDefaultFile": { type: "boolean", default: true },
    "tidal.boot.customFiles": { type: "array", items: { type: "string" } },
    "tidal.boot.disableEditorIntegration": { type: "boolean", default: false },
  },
} as const satisfies JSONSchema7;

export type TidalSettings = Required<FromSchema<typeof TidalSettingsSchema>>;
