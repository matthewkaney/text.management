jest.mock("fs/promises");

import { Filesystem } from "./filesystem";

test("current doc id is null initially", () => {
  let filesystem = new Filesystem();
  expect(filesystem.currentDocID).toBe(null);
});

test("loaded file", () => {
  new Filesystem().loadDoc("test.tidal");
});
