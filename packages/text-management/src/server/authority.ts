import { ChangeSet, Text } from "@codemirror/state";

import { readFile, writeFile } from "fs/promises";

export class Document {
  private path: string | undefined;
  private doc: Promise<Text>;

  private autosaveTime = 1000;

  constructor(path?: string) {
    this.path = path;
    this.doc = this.loadDocument(path);
  }

  private async loadDocument(path?: string) {
    if (path) {
      try {
        return Text.of(
          (await readFile(path, { encoding: "utf-8" })).split("\n")
        );
      } catch (err) {
        if (err.code === "ENOENT") {
          return Text.of([""]);
        } else {
          throw err;
        }
      }
    } else {
      return Text.of([""]);
    }
  }

  get contents() {
    return this.doc.then((doc) => doc.toString());
  }

  private autosaveTimer?: number | string | NodeJS.Timeout;

  replace(contents: string) {
    this.doc = this.doc.then(() => Text.of(contents.split("\n")));
    this.save();
  }

  update(changes: ChangeSet) {
    this.doc = this.doc.then((doc) => changes.apply(doc));

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
        await writeFile(this.path, (await this.doc).toString());
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
