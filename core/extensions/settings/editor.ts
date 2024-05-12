import { autocompletion } from "@codemirror/autocomplete";
import { json } from "@codemirror/lang-json";
import { jsonSchema } from "codemirror-json-schema";

import { TidalSettingsSchema } from "packages/languages/tidal/settings";

export function settings() {
  return [
    autocompletion(),
    json(),
    // TODO: Figure out how to get all the JSON Schema extensions to work together
    jsonSchema(TidalSettingsSchema),
  ];
}
