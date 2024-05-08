import { extractStatements } from "./parse";

describe("Parsing Tidal code", () => {
  test("Separating lines at the same indentation level", () => {
    let code = ['d1 $ s "bd sn"', 'd2 $ s "'];
    expect(extractStatements(code.join("\n"))).toEqual(code);
  });
});
