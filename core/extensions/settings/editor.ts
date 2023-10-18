import { Extension } from "@codemirror/state";

import { autocompletion } from "@codemirror/autocomplete";
import { json } from "@codemirror/lang-json";
import { jsonSchema } from "codemirror-json-schema";

import { asJSONSchema } from "./schema";
import { TidalSettingsSchema } from "packages/languages/tidal/settings";

export function settings(): Extension {
  return [
    autocompletion(),
    json(),
    // TODO: Figure out how to get all the JSON Schema extensions to work together
    jsonSchema(asJSONSchema(TidalSettingsSchema) as any),
  ];
}
