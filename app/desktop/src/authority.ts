import { readFile } from "fs/promises";
import { basename } from "path";

import { BehaviorSubject, ReplaySubject, scan } from "rxjs";

import { ChangeSet, Text } from "@codemirror/state";

import { DocUpdate, FileDoc, TextManagementAPI } from "@core/api";

export class Document {
  readonly updates$: ReplaySubject<DocUpdate>;

  get text$() {
    return this.updates$.pipe(
      scan((text, update) => {
        let changeSet = ChangeSet.fromJSON(update.changes);
        return changeSet.apply(text);
      }, this.initialText)
    );
  }

  get version() {
    return this.initialVersion + this.updateList.length;
  }

  constructor(
    readonly initialText = Text.of([""]),
    readonly initialVersion = 0,
    private updateList: Omit<DocUpdate, "version">[] = []
  ) {
    this.updates$ = new ReplaySubject();
    this.updateList.forEach((update, index) =>
      this.updates$.next({ version: index + this.initialVersion, ...update })
    );
  }

  update(update: DocUpdate) {
    if (this.destroyed) throw new Error("Can't update a destroyed document");

    const { version, ...updateData } = update;

    if (version !== this.version) {
      throw new Error(`Incompatible update version: ${version}`);
    }

    this.updateList.push(updateData);
    this.updates$.next(update);
  }

  private destroyed = false;

  destroy() {
    this.updates$.complete();
  }
}

export class DesktopDoc implements FileDoc {
  saveState$ = new BehaviorSubject(false);
  path$: BehaviorSubject<string | null>;
  name$: BehaviorSubject<string>;

  private document: Promise<Document>;

  get snapshot() {
    return this.document.then((doc) => ({
      initialVersion: doc.initialVersion,
      initialText: doc.initialText,
      updates$: doc.updates$,
    }));
  }

  constructor(path?: string) {
    this.path$ = new BehaviorSubject(path || null);
    this.name$ = new BehaviorSubject(path ? basename(path) : "untitled");

    this.document = loadFile(path);
  }

  async pushUpdate(update: DocUpdate) {
    let { version } = update;
    let document = await this.document;

    if (version === document.version) {
      document.update(update);
      return true;
    } else {
      return false;
    }

    //   this.versions.push(updateData);
    //   let changeSet = ChangeSet.fromJSON(update.changes);
    //   doc.update(changeSet);

    //   for (let evaluation of update.evaluations || []) {
    //     if (typeof evaluation[0] === "number") {
    //       let [from, to] = evaluation as [number, number];
    //       this.emit("code", doc.slice(from, to));
    //     } else {
    //       let [method] = evaluation;
    //       this.emit("code", method);
    //     }
    //   }

    //   return true;
    // } else {
    //   return false;
    // }
  }

  async destroy() {}
}

async function loadFile(path?: string): Promise<Document> {
  let initialVersion = 0;
  let initialText: Text;
  let updateList: Omit<DocUpdate, "version">[] = [];

  if (path) {
    try {
      let contents = await readFile(path, { encoding: "utf-8" });
      initialText = Text.of(contents.split(/\r?\n/));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        initialText = Text.of([""]);
      } else {
        throw err;
      }
    }
  } else {
    initialText = Text.of([""]);
  }

  return new Document(initialText, initialVersion, updateList);
}

export class Authority extends TextManagementAPI {
  private docID = 0;

  private id = this.getID();
  public doc = new DesktopDoc();

  constructor() {
    super();

    this.onListener["open"] = (listener) => {
      let { id, doc } = this;
      listener({ id, doc });
    };
  }

  loadDoc(path?: string) {
    this.emit("close", { id: this.id });

    this.doc = new DesktopDoc(path);
    this.id = this.getID();

    this.emit("open", { id: this.id, doc: this.doc });
  }

  private getID() {
    let id = this.docID;
    this.docID = id + 1;
    return id.toString();
  }

  getTidalVersion(): Promise<string> {
    return new Promise(() => {});
  }
}
