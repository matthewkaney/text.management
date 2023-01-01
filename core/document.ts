import { ChangeSet, Text } from "@codemirror/state";

import { readFile, writeFile } from "fs/promises";
import { EventEmitter } from "./events";

interface DocumentEvents {
  changed: boolean;
}

export class Document extends EventEmitter<DocumentEvents> {
  public static async create(path?: string) {
    if (path) {
      try {
        let doc = await readFile(path, { encoding: "utf-8" });
        return new Document(Text.of(doc.split(/\r?\n/)), path, false);
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
          return new Document(Text.of([""]), path);
        } else {
          throw err;
        }
      }
    } else {
      return new Document(Text.of([""]));
    }
  }

  private path: string | undefined;
  private doc: Text;

  private _changed = true;

  get changed() {
    return this._changed;
  }

  protected set changed(changed) {
    this.emit("changed", changed);
    this._changed = changed;
  }

  private autosaveTime = 1000;

  private constructor(doc: Text, path?: string, changed: boolean = true) {
    super();

    this.onListener["changed"] = (listener) => {
      listener(this.changed);
    };

    this.path = path;
    this.doc = doc;
    this.changed = changed;

    if (this.changed) {
      this.save();
    }
  }

  get contents() {
    return this.doc.toString();
  }

  slice(from: number, to?: number) {
    return this.doc.sliceString(from, to);
  }

  toJSON() {
    return this.doc.toJSON();
  }

  replace(contents: string) {
    this.doc = Text.of(contents.split("\n"));
    this.save();
  }

  private autosaveTimer?: number | string | NodeJS.Timeout;

  update(changes: ChangeSet) {
    this.doc = changes.apply(this.doc);

    if (!this.changed) {
      this.changed = true;
    }

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

  save() {
    const write = async () => {
      while (this.path && this.writeRequest) {
        this.writing = true;
        this.writeRequest = false;
        await writeFile(this.path, this.contents);
        this.writing = false;
      }

      if (this.changed) {
        this.changed = false;
      }
    };

    if (this.writing) {
      this.writeRequest = true;
    } else {
      this.writeRequest = true;
      write();
    }
  }

  saveAs(path: string) {
    return new Document(this.doc, path);
  }
}
