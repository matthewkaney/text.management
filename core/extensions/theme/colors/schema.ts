import { JSONSchema } from "json-schema-to-ts";

const color = {
  type: "string",
  format: "color",
} as const;

export const ThemeColorSchema = {
  type: "object",
  default: {},
  properties: {
    background: { ...color, description: "General background color" },
    foreground: { ...color, description: "General foreground color" },
    foregroundInverted: { ...color, description: "Inverted foreground color" },
    focusBorder: { ...color, description: "Border color for focused elements" },
    errorBackground: {
      ...color,
      description: "General background color for errors",
    },
    errorForeground: {
      ...color,
      description: "General foreground color for errors",
    },
    selectionBackground: {
      ...color,
      description: "Selection background",
    },
    "ui.background": color,
    "ui.backgroundInactive": color,
    "ui.backgroundActive": color,
  },
} as const satisfies JSONSchema;
