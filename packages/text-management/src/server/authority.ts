import { ChangeSet, Text } from "@codemirror/state";

import { readFile, writeFile } from "fs/promises";

export class Document {
  public static async create(path?: string) {
    if (path) {
      try {
        return new Document(await readFile(path, { encoding: "utf-8" }), path);
      } catch (err) {
        if (err.code === "ENOENT") {
          return new Document("", path);
        } else {
          throw err;
        }
      }
    } else {
      return new Document("");
    }
  }

  private path: string | undefined;
  private doc: Text;

  private autosaveTime = 1000;

  private constructor(docText: string, path?: string) {
    this.path = path;
    this.doc = Text.of(docText.split("\n"));
  }

  get contents() {
    return this.doc.toString();
  }

  slice(from: number, to?: number) {
    return this.doc.sliceString(from, to);
  }

  private autosaveTimer?: number | string | NodeJS.Timeout;

  replace(contents: string) {
    this.doc = Text.of(contents.split("\n"));
    this.save();
  }

  update(changes: ChangeSet) {
    this.doc = changes.apply(this.doc);

    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
      this.autosaveTimer = undefined;
    }

    this.autosaveTimer = setTimeout(async () => {
      this.autosaveTimer = undefined;
      this.save();
    }, this.autosaveTime);
  }

  private writing = false;
  private writeRequest = false;

  private save() {
    const write = async () => {
      while (this.path && this.writeRequest) {
        this.writing = true;
        this.writeRequest = false;
        await writeFile(this.path, this.contents);
        this.writing = false;
      }
    };

    if (this.writing) {
      this.writeRequest = true;
    } else {
      this.writeRequest = true;
      write();
    }
  }
}
