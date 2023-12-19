import * as fs from "__mocks__/fs/promises";

jest.mock("fs/promises", () => fs);

import { Filesystem, DesktopDocument } from "./filesystem";
import { Text } from "@codemirror/state";

describe("Filesystem", () => {
  const filesystem = new Filesystem();
  test("Loading a document twice", () => {
    const doc1 = filesystem.loadDoc("foo.txt");
    const doc2 = filesystem.loadDoc("foo.txt");
    expect(doc1 === doc2).toBeTruthy();
  });
});

describe("DesktopDocument", () => {
  test("Loading an empty document", () => {
    const doc = new DesktopDocument("0");
    expect(doc.content).toEqual({ doc: Text.empty, version: 0 });
    expect(doc.fileStatus).toEqual({ path: null, saved: false, version: 0 });
  });

  test("Loading an existing document", (done) => {
    const doc = new DesktopDocument("0", "existing.txt");
    expect(doc.content).toEqual(null);
    expect(doc.fileStatus).toEqual({
      path: "existing.txt",
      saved: true,
      version: null,
    });

    const unload = doc.on("loaded", (status) => {
      expect(doc.content).toEqual({
        doc: Text.of(["Existing Document"]),
        version: 0,
      });
      expect(status).toEqual({
        path: "existing.txt",
        saved: true,
        version: 0,
        doc: Text.of(["Existing Document"]),
      });
      unload();
      done();
    });

    fs.__resolveRead("existing.txt", "Existing Document");
  });
});
