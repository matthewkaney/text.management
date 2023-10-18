import { JSONSchema7, FromSchema as FromJSONSchema } from "json-schema-to-ts";
import { Draft07 } from "json-schema-library";

export interface SettingsSchema {
  [name: string]: JSONSchema7;
}

export type FromSchema<S extends SettingsSchema> = {
  [Name in keyof S]: FromJSONSchema<S[Name]>;
};

export function asJSONSchema(schema: SettingsSchema) {
  return {
    type: "object",
    properties: schema,
  } as const;
}

export function getSettings<S extends SettingsSchema>(
  schema: S,
  data: unknown
) {
  let settings: { [name in keyof S]: S[name] } = {};

  for (let name in schema) {
    if (typeof data === "object" && data && name in data) {
      settings[name] = data[name as keyof data];
    }
  }

  return;
}

// function normalizeSettings<S extends JSONSchema>(
//   typedSchema: S,
//   settings: unknown
// ) {
//   let completeSettings: any = {};

//   let schema = typedSchema as any;

//   for (const [propName, propSchema] of Object.entries(schema.properties)) {
//     // This shouldn't be necessary if schema has a specific type
//     if (typeof propSchema !== "object" || propSchema === null) break;

//     if (typeof settings === "object" && settings && propName in settings) {
//       // TODO: Validate

//       completeSettings[propName] = (settings as { [key: string]: unknown })[
//         propName
//       ];

//       continue;
//     }

//     if ("const" in propSchema) {
//       completeSettings[propName] = propSchema.const;
//     } else if ("default" in propSchema) {
//       completeSettings[propName] = propSchema.default;
//     } else if ("type" in propSchema && propSchema.type === "array") {
//       completeSettings[propName] = [];
//     } else {
//       throw Error(
//         `No way to generate a default value for settings property "${propName}"`
//       );
//     }
//   }

//   return completeSettings as Required<FromSchema<S>>;
// }

// export function normalizeTidalSettings(settings: unknown) {
//   return normalizeSettings(TidalSettingsSchema, settings);
// }
