import { readFile, writeFile } from "fs/promises";

import { ChangeSet, Text } from "@codemirror/state";

import { EventEmitter } from "@core/events";
import { DocumentUpdate } from "@core/api";

interface DocumentEvents {
  saved: number;
  pathChanged: string;
  saveStateChanged: boolean;
}

interface DocumentState {
  doc: Text;
  version: number;
}

class DesktopDocument extends EventEmitter<DocumentEvents> {
  path: string | null = null;

  content: Promise<DocumentState>;

  lastSavedVersion: Promise<number | null> = Promise.resolve(null);

  // This is not managed by this object, but rather by the editor UI
  saveState: boolean = true;

  constructor(path?: string) {
    super();

    this.path = path ?? null;

    this.content = (async () => {
      if (path) {
        try {
          let doc = Text.of(
            (await readFile(path, { encoding: "utf-8" })).split(/\r?\n/)
          );
          let version = 0;
          this.lastSavedVersion = Promise.resolve(0);
          return { doc, version };
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
            throw err;
          }
        }
      }

      return { doc: Text.of([""]), version: 0 };
    })();
  }

  public save(newPath: string | null = null) {
    if (newPath && this.path !== newPath) {
      this.path = newPath;
      this.emit("pathChanged", newPath);
    }

    let path = this.path;
    let content = this.content;

    if (!path) {
      throw Error("Can't save a document without a path");
    }

    this.lastSavedVersion = this.lastSavedVersion.then(async () => {
      if (path) {
        let { doc, version } = await content;
        await writeFile(path, doc.sliceString(0));
        this.emit("saved", version);
        return version;
      } else {
        throw Error("Lost document path during save");
      }
    });
  }

  public update(update: DocumentUpdate, saveState: boolean) {
    let { changes, version } = update;
    this.content = this.content.then(async (previous) => {
      if (version !== previous.version + 1) {
        throw Error("Not all updates were sent to the filesystem");
      }

      let doc = ChangeSet.fromJSON(changes).apply(previous.doc);
      return { doc, version };
    });

    if (this.saveState !== saveState) {
      this.saveState = saveState;
      this.emit("saveStateChanged", saveState);
    }
  }
}

interface FilesystemEvents {
  open: { id: string; doc: DesktopDocument };
  currentDocChanged: DesktopDocument | null;
}

export class Filesystem extends EventEmitter<FilesystemEvents> {
  docs = new Map<string, DesktopDocument>();

  getDoc(id: string) {
    let doc: DesktopDocument | undefined;
    if ((doc = this.docs.get(id))) {
      return doc;
    }

    throw Error("Tried to fetch a non-existent doc.");
  }

  loadDoc(path?: string) {
    let id = this.getID();
    let doc = new DesktopDocument(path);
    this.docs.set(id, doc);

    this.emit("open", { id, doc });
  }

  private _nextDocID = 0;

  private getID() {
    return (this._nextDocID++).toString();
  }

  private _currentDocID: string | null = null;

  get currentDocID() {
    return this._currentDocID;
  }

  set currentDocID(docID) {
    this._currentDocID = docID;
    this.emit("currentDocChanged", this.currentDoc);
  }

  get currentDoc() {
    return this._currentDocID !== null
      ? this.docs.get(this._currentDocID) ?? null
      : null;
  }
}
