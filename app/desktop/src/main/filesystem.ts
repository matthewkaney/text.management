import { dirname } from "path";
import { readFile, writeFile, mkdir } from "fs/promises";

import { ChangeSet, Text } from "@codemirror/state";

import { EventEmitter } from "@core/events";
import { DocumentUpdate } from "@core/api";
import { getID } from "@core/ids";

interface DocumentEvents {
  loaded: FileStatus & { doc: Text; version: number };
  status: SavedStatus;
  update: DocumentState;
  closed: void;
}

interface FileStatus {
  path: string | null;
  version: number | null;
  saved: boolean | "saving";
}

export type SavedStatus = FileStatus & { path: string; version: number };

interface DocumentState {
  doc: Text;
  version: number;
}

export class DesktopDocument extends EventEmitter<DocumentEvents> {
  fileStatus: FileStatus = { path: null, version: null, saved: false };
  content: DocumentState | null = null;

  get path() {
    return this.fileStatus.path;
  }

  get needsSave() {
    // Check for blank, unsaved documents
    if (
      !this.fileStatus.path &&
      (!this.content || this.content.doc.eq(Text.empty))
    ) {
      return false;
    }

    // Then check if the document has been edited
    return this.fileStatus.version === this.content?.version
      ? !this.fileStatus.saved
      : true;
  }

  constructor(
    public readonly id: string,
    path: string | null = null,
    defaultContent = ""
  ) {
    super();

    const loadContent = async () => {
      let doc = Text.of(defaultContent.split(/\r?\n/));
      let version = 0;
      let saved = false;

      if (!path) {
        this.content = { doc, version };
        this.fileStatus = { path, version, saved };
      } else {
        this.fileStatus = { path, version: null, saved: true };
        try {
          doc = Text.of(
            (await readFile(path, { encoding: "utf-8" })).split(/\r?\n/)
          );

          saved = true;
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
            throw err;
          }
        }

        await mkdir(dirname(path), { recursive: true });
        this.content = { doc, version };
        let fileStatus = { path, version, saved };
        this.fileStatus = fileStatus;
        this.emit("loaded", { ...fileStatus, doc });
      }
    };

    loadContent();
  }

  private saveQueue: Map<string, DocumentState> = new Map();

  async save(newPath: string | null = null) {
    let { path, version } = this.fileStatus;
    path = newPath ?? path;

    let content = this.content;

    if (version === null || content === null)
      throw Error("Can't save an unloaded document.");

    if (path === null) throw Error("Can't save a document with no path.");

    let fileStatus: SavedStatus = { path, version, saved: "saving" };
    this.fileStatus = fileStatus;
    this.emit("status", fileStatus);

    // Get the previous save for this file path
    let currentSave = this.saveQueue.get(path);

    // If there's a currently-active save, then queue this one and exit
    if (currentSave) {
      if (content.version > currentSave.version) {
        this.saveQueue.set(path, content);
      }
      return;
    }

    currentSave = content;

    // Process saves
    while (currentSave) {
      let doc: Text;
      ({ doc, version } = currentSave);
      await writeFile(path, doc.sliceString(0));
      currentSave = this.saveQueue.get(path);
      this.saveQueue.delete(path);
    }

    if (this.fileStatus.path === path) {
      fileStatus = { path, version, saved: true };
      this.fileStatus = fileStatus;
      this.emit("status", fileStatus);
    }
  }

  update(update: DocumentUpdate) {
    if (!this.content) throw Error("Can't update an unloaded document");

    let { changes, version } = update;

    let doc = ChangeSet.fromJSON(changes).apply(this.content.doc);
    let content = { doc, version };

    this.content = content;
    this.emit("update", content);
  }

  async close() {
    // TODO: Better handling to catch save errors, emit additional saves, etc
    this.emit("closed", undefined);
  }
}

interface FilesystemEvents {
  open: DesktopDocument;
  current: DesktopDocument | null;
  setCurrent: string;
}

export class Filesystem extends EventEmitter<FilesystemEvents> {
  docs = new Map<string, DesktopDocument>();

  getDoc(id: string) {
    return this.docs.get(id) ?? null;
  }

  getIDFromPath(path: string) {
    for (let [id, doc] of this.docs) {
      if (doc.path === path) {
        return id;
      }
    }

    return null;
  }

  getDocFromPath(path: string) {
    let id = this.getIDFromPath(path);

    if (id === null) return null;

    return this.getDoc(id);
  }

  loadDoc(path?: string, defaultContent?: string) {
    let existing: DesktopDocument | null;

    if (path && (existing = this.getDocFromPath(path))) {
      this.emit("setCurrent", existing.id);
      return existing;
    }

    let id = getID();
    let document = new DesktopDocument(id, path, defaultContent);
    this.docs.set(id, document);

    document.once("closed", () => {
      this.docs.delete(id);
    });

    this.emit("open", document);

    return document;
  }

  private _currentDocID: string | null = null;

  get currentDocID() {
    return this._currentDocID;
  }

  set currentDocID(docID) {
    this._currentDocID = docID;
    this.emit("current", this.currentDoc);
  }

  get currentDoc() {
    return this._currentDocID !== null ? this.getDoc(this._currentDocID) : null;
  }
}
