import { SettingsSchema } from "@core/state/schema";

export const TidalSettingsSchema = {
  // environment: { const: "ghci" },
  "tidal.boot.useDefaultFile": { type: "boolean", default: true },
  "tidal.boot.customFiles": { type: "array", items: { type: "string" } },
  "tidal.boot.disableEditorIntegration": { type: "boolean", default: false },
} as const satisfies SettingsSchema;
