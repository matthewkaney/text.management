import { SettingsSchema } from "@core/state/schema";

import { ThemeColorSchema } from "./colors/schema";

export const ThemeSettingsSchema = {
  properties: {
    "theme.customColors": ThemeColorSchema,
  },
} as const satisfies SettingsSchema;
