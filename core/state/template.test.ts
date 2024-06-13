import { JSONSchema, FromSchema } from "json-schema-to-ts";

import { normalize, validate } from "./template";

describe("JSON Schema Tools", () => {
  describe("normalize", () => {
    const schema = {
      type: "object",
      properties: { a: { default: "foo" }, b: {} },
    } as const satisfies JSONSchema;

    const result = normalize(schema) as FromSchema<typeof schema>;

    test("should include default values", () => {
      expect(result.a).toBe("foo");
      expect(result).not.toHaveProperty("b");
    });
  });

  describe("validate", () => {});
});
