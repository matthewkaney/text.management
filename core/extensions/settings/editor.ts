import { autocompletion } from "@codemirror/autocomplete";
import { json } from "@codemirror/lang-json";
import { jsonSchema } from "codemirror-json-schema";

import { EditorSettings } from "@core/extensions/basicSetup/settings";
import { ThemeSettingsSchema } from "@core/extensions/theme/settings";
import { TidalSettingsSchema } from "packages/languages/tidal/settings";

export function settings() {
  return [
    autocompletion(),
    json(),
    jsonSchema({
      //@ts-ignore
      properties: {
        ...ThemeSettingsSchema.properties,
        ...TidalSettingsSchema.properties,
        ...EditorSettings.properties,
      },
    }),
  ];
}
