import { SettingsSchema } from "@core/state/schema";

export const TidalSettingsSchema = {
  properties: {
    // environment: { const: "ghci" },
    "tidal.boot.useDefaultFile": {
      type: "boolean",
      default: true,
      description:
        "Specifies whether to run Tidal's default BootFile.hs on startup",
    },
    "tidal.boot.customFiles": { type: "array", items: { type: "string" } },
    "tidal.runFromSource": {
      type: "string",
      description:
        "Path to a local copy of the Tidal source code. If this is provided, Tidal will be run from this source code instead of the installed library",
    },
    "tidal.boot.disableEditorIntegration": { type: "boolean", default: false },
  },
} as const satisfies SettingsSchema;
