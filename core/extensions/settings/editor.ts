import { Extension } from "@codemirror/state";

import { autocompletion } from "@codemirror/autocomplete";
import { json } from "@codemirror/lang-json";
import { jsonSchema } from "codemirror-json-schema";

import { TidalSettingsSchema } from "packages/languages/tidal/settings";

export function settings(): Extension {
  return [autocompletion(), json(), jsonSchema(TidalSettingsSchema)];
}
