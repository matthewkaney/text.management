import { readFile, writeFile } from "fs/promises";
import { basename } from "path";

import {
  BehaviorSubject,
  map,
  skip,
  debounceTime,
  take,
  concatWith,
} from "rxjs";

import { Text } from "@codemirror/state";

import { Tab, TextManagementAPI } from "@core/api";
import { FirebaseDocument } from "@core/extensions/firebase/api";

export class FileDocument extends FirebaseDocument {
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
  public path$: BehaviorSubject<string | null>;

  public saveAs(path: string) {
    this.saveState$.next(false);
    this.path$.next(path);

    this.watch();
  }

  private constructor(saved: boolean, initialText?: Text, path?: string) {
    super(initialText);

    this.saveState$ = new BehaviorSubject(saved);
    this.path$ = new BehaviorSubject(path || null);

    this.watch();
  }

  private unwatch = () => {};

  private watch() {
    this.unwatch();

    const path = this.path$.value;

    if (path) {
      let lastSaved = this.saveState$.value ? this.initialText : undefined;
      let pendingSave: Text | undefined;

      // First, set up write logic
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

        this.saveState$.next(!!lastSaved && nextSave.eq(lastSaved));
        pendingSave = undefined;
      };

      // Then hook up subscriptions
      const saveStateWatch = this.text$.subscribe({
        next: (nextSave) => {
          this.saveState$.next(!!lastSaved && nextSave.eq(lastSaved));
        },
      });

      const textWatch = this.text$
        .pipe(take(1), concatWith(this.text$.pipe(skip(1), debounceTime(1000))))
        .subscribe({
          next: (nextSave) => {
            if (!lastSaved || !nextSave.eq(lastSaved)) {
              write(nextSave);
            }
          },
        });

      this.unwatch = () => {
        saveStateWatch.unsubscribe();
        textWatch.unsubscribe();
      };
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

    this.path$
      .pipe(map((path) => (path ? basename(path) : "untitled")))
      .subscribe(this.name$);

    this.document = FileDocument.open(path);

    this.document.then(({ path$, saveState$ }) => {
      path$.subscribe(this.path$);
      saveState$.subscribe(this.saveState$);
    });
  }

  async destroy() {
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

  async saveDocAs(path: string) {
    (await this.tab.content).saveAs(path);
  }

  private getID() {
    let id = this.docID;
    this.docID = id + 1;
    return id.toString();
  }

  async createSession() {}

  async joinSession(id: string) {}

  getTidalVersion(): Promise<string> {
    return new Promise(() => {});
  }
}
