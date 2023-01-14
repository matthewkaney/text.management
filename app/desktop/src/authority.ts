import { readFile } from "fs/promises";
import { basename } from "path";

import { BehaviorSubject, ReplaySubject, scan } from "rxjs";

import { ChangeSet, Text } from "@codemirror/state";

import { Document, DocumentUpdate, Tab, TextManagementAPI } from "@core/api";

export class LocalDocument implements Document {
  readonly updates$: ReplaySubject<DocumentUpdate>;

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
    private updateList: Omit<DocumentUpdate, "version">[] = []
  ) {
    this.updates$ = new ReplaySubject();
    this.updateList.forEach((update, index) =>
      this.updates$.next({ version: index + this.initialVersion, ...update })
    );
  }

  pushUpdate(update: DocumentUpdate) {
    if (this.destroyed) throw new Error("Can't update a destroyed document");

    const { version, ...updateData } = update;

    if (version !== this.version) return Promise.resolve(false);

    this.updateList.push(updateData);
    this.updates$.next(update);
    return Promise.resolve(true);
  }

  private destroyed = false;

  destroy() {
    this.updates$.complete();
  }
}

export class DesktopTab implements Tab {
  saveState$ = new BehaviorSubject(false);
  path$: BehaviorSubject<string | null>;
  name$: BehaviorSubject<string>;

  private document: Promise<Document>;

  get content() {
    return this.document;
  }

  constructor(path?: string) {
    this.path$ = new BehaviorSubject(path || null);
    this.name$ = new BehaviorSubject(path ? basename(path) : "untitled");

    this.document = loadFile(path);

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
  let updateList: Omit<DocumentUpdate, "version">[] = [];

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

  return new LocalDocument(initialText, initialVersion, updateList);
}

export class Authority extends TextManagementAPI {
  private docID = 0;

  private id = this.getID();
  public tab = new DesktopTab();

  constructor() {
    super();

    this.onListener["open"] = (listener) => {
      let { id, tab } = this;
      listener({ id, tab });
    };
  }

  loadDoc(path?: string) {
    this.emit("close", { id: this.id });

    this.tab = new DesktopTab(path);
    this.id = this.getID();

    this.emit("open", { id: this.id, tab: this.tab });
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
