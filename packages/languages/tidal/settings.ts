import { SettingsSchema, FromSchema } from "@core/extensions/settings/schema";

export const TidalSettingsSchema = {
  // environment: { const: "ghci" },
  "tidal.boot.useDefaultFile": { type: "boolean", default: true },
  "tidal.boot.customFiles": { type: "array", items: { type: "string" } },
  "tidal.boot.disableEditorIntegration": { type: "boolean", default: false },
} satisfies SettingsSchema;

export type TidalSettings = FromSchema<typeof TidalSettingsSchema>;
