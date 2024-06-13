import { JSONSchema } from "json-schema-to-ts";

export function normalize(schema: JSONSchema, data?: unknown) {
  if (typeof schema === "boolean") {
    return data;
  }

  if ("properties" in schema) {
    let normalized: { [prop: string]: any } = {};

    for (let prop in schema.properties) {
      let propData =
        typeof data === "object" && data !== null && prop in data
          ? data[prop as keyof typeof data]
          : undefined;

      let normalizedProp = normalize(schema.properties[prop], propData);

      if (normalizedProp !== undefined) {
        normalized[prop] = normalizedProp;
      }
    }

    return normalized;
  }

  if (validate(schema, data)) {
    return data;
  }

  if ("default" in schema) {
    return schema.default;
  }

  return undefined;
}

export function validate(schema: JSONSchema, data: unknown) {
  if (data === undefined) {
    return false;
  }

  if (typeof schema === "boolean") {
    return schema;
  }

  // Validate type keyword
  if (schema.type !== undefined && !validateType(schema.type, data)) {
    return false;
  }

  // Validate properties keyword
  if (typeof data === "object" && data !== null && "properties" in schema) {
    for (let property in schema.properties) {
      if (property in data) {
        if (
          !validate(
            schema.properties[property],
            data[property as keyof typeof data]
          )
        ) {
          return false;
        }
      }
    }
  }

  return true;
}

export type JSONSchemaType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array"
  | "null";

function validateType(
  type: JSONSchemaType | readonly JSONSchemaType[],
  data: any
): Boolean {
  if (type instanceof Array) {
    return type.some((t) => validateType(t, data));
  }

  switch (type) {
    case "string":
      return typeof data === "string";
    case "number":
      return typeof data === "number";
    case "integer":
      return Number.isInteger(data);
    case "boolean":
      return typeof data === "boolean";
    case "object":
      return typeof data === "object" && data !== null && !Array.isArray(data);
    case "array":
      return Array.isArray(data);
    case "null":
      return data === null;
    default:
      return type satisfies never;
  }
}
