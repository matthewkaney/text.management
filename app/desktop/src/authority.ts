import { readFile, writeFile } from "fs/promises";
import { basename } from "path";

import { BehaviorSubject, ReplaySubject, scan, tap, debounceTime } from "rxjs";

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

export class FileDocument extends LocalDocument {
  static async open(path?: string) {
    let initialText: Text | undefined;
    let saved = false;

    if (path) {
      try {
        let contents = await readFile(path, { encoding: "utf-8" });
        initialText = Text.of(contents.split(/\r?\n/));
        saved = true;
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
          throw err;
        }
      }
    }

    return new FileDocument(saved, initialText, path);
  }

  public saveState$: BehaviorSubject<boolean>;
  public path: string | null;

  private constructor(saved: boolean, initialText?: Text, path?: string) {
    super(initialText);

    this.saveState$ = new BehaviorSubject(saved);
    this.path = path || null;

    this.watch();
  }

  private watching = false;

  private watch() {
    const path = this.path;

    if (path && !this.watching) {
      this.watching = true;

      let lastSaved = this.saveState$.value ? this.initialText : undefined;
      let pendingSave: Text | undefined;

      const write = async (nextSave: Text) => {
        // There's already a save in progress
        // Mark this one as pending and move on
        if (pendingSave) {
          pendingSave = nextSave;
          return;
        }

        while (!pendingSave || !pendingSave.eq(nextSave)) {
          pendingSave = nextSave;
          await writeFile(path, nextSave.sliceString(0));
          lastSaved = nextSave;
        }

        this.saveState$.next(true);
        pendingSave = undefined;
      };

      this.text$
        .pipe(
          tap((nextSave) => {
            this.saveState$.next(!!lastSaved && nextSave.eq(lastSaved));
          }),
          debounceTime(1000)
        )
        .subscribe({
          next: (nextSave) => {
            if (!lastSaved || !nextSave.eq(lastSaved)) {
              write(nextSave);
            }
          },
        });
    }
  }
}

export class DesktopTab implements Tab {
  saveState$: BehaviorSubject<boolean>;
  path$: BehaviorSubject<string | null>;
  name$: BehaviorSubject<string>;

  private document: Promise<FileDocument>;

  get content() {
    return this.document;
  }

  constructor(path?: string) {
    this.saveState$ = new BehaviorSubject(!!path);
    this.path$ = new BehaviorSubject(path || null);
    this.name$ = new BehaviorSubject(path ? basename(path) : "untitled");

    this.document = FileDocument.open(path);

    this.document.then(({ saveState$ }) => {
      saveState$.subscribe(this.saveState$);
    });

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

  async destroy() {
    this.path$.complete();
    this.name$.complete();
    this.document.then((doc) => {
      doc.destroy();
    });
  }
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

    this.tab.destroy();

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
