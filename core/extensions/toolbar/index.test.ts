/**
 * @jest-environment jsdom
 */

import { ToolbarMenu } from "./index";

describe("Toolbar Menu", () => {
  test("Snapshot test", () => {
    const menu = new ToolbarMenu("Test", []);
    expect(menu.dom).toMatchSnapshot();
  });
});
