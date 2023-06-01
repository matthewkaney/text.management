import { readFile, writeFile } from "fs/promises";

import { ChangeSet, Text } from "@codemirror/state";

import { EventEmitter } from "@core/events";
import { DocumentUpdate } from "@core/api";

// import { basename } from "path";

// import {
//   Observable,
//   BehaviorSubject,
//   ReplaySubject,
//   map,
//   scan,
//   skip,
//   debounceTime,
//   take,
//   concatWith,
//   shareReplay,
//   startWith,
// } from "rxjs";

// export class LocalDocument implements Document {
//   readonly updates$: ReplaySubject<DocumentUpdate>;

//   readonly text$: Observable<Text>;

//   get version() {
//     return this.initialVersion + this.updateList.length;
//   }

//   constructor(
//     readonly initialText = Text.of([""]),
//     readonly initialVersion = 0,
//     private updateList: Omit<DocumentUpdate, "version">[] = []
//   ) {
//     this.updates$ = new ReplaySubject();
//     this.updateList.forEach((update, index) =>
//       this.updates$.next({ version: index + this.initialVersion, ...update })
//     );

//     this.text$ = this.updates$.pipe(
//       scan(
//         (text, { changes }) => ChangeSet.fromJSON(changes).apply(text),
//         this.initialText
//       ),
//       startWith(this.initialText),
//       shareReplay(1)
//     );
//   }

//   pushUpdate(update: DocumentUpdate) {
//     if (this.destroyed) throw new Error("Can't update a destroyed document");

//     const { version, ...updateData } = update;

//     if (version !== this.version) return Promise.resolve(false);

//     this.updateList.push(updateData);
//     this.updates$.next(update);
//     return Promise.resolve(true);
//   }

//   private destroyed = false;

//   destroy() {
//     this.updates$.complete();
//   }
// }

// export class FileDocument extends LocalDocument {
//   static async open(path?: string) {
//     let initialText: Text | undefined;
//     let saved = false;

//     if (path) {
//       try {
//         let contents = await readFile(path, { encoding: "utf-8" });
//         initialText = Text.of(contents.split(/\r?\n/));
//         saved = true;
//       } catch (err) {
//         if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
//           throw err;
//         }
//       }
//     }

//     return new FileDocument(saved, initialText, path);
//   }

//   public saveState$: BehaviorSubject<boolean>;
//   public path$: BehaviorSubject<string | null>;

//   public saveAs(path: string) {
//     this.saveState$.next(false);
//     this.path$.next(path);

//     this.watch();
//   }

//   private constructor(saved: boolean, initialText?: Text, path?: string) {
//     super(initialText);

//     this.saveState$ = new BehaviorSubject(saved);
//     this.path$ = new BehaviorSubject(path || null);

//     this.watch();
//   }

//   private unwatch = () => {};

//   private watch() {
//     this.unwatch();

//     const path = this.path$.value;

//     if (path) {
//       let lastSaved = this.saveState$.value ? this.initialText : undefined;
//       let pendingSave: Text | undefined;

//       // First, set up write logic
//       const write = async (nextSave: Text) => {
//         // There's already a save in progress
//         // Mark this one as pending and move on
//         if (pendingSave) {
//           pendingSave = nextSave;
//           return;
//         }

//         while (!pendingSave || !pendingSave.eq(nextSave)) {
//           pendingSave = nextSave;
//           await writeFile(path, nextSave.sliceString(0));
//           lastSaved = nextSave;
//         }

//         this.saveState$.next(!!lastSaved && nextSave.eq(lastSaved));
//         pendingSave = undefined;
//       };

//       // Then hook up subscriptions
//       const saveStateWatch = this.text$.subscribe({
//         next: (nextSave) => {
//           this.saveState$.next(!!lastSaved && nextSave.eq(lastSaved));
//         },
//       });

//       const textWatch = this.text$
//         .pipe(take(1), concatWith(this.text$.pipe(skip(1), debounceTime(1000))))
//         .subscribe({
//           next: (nextSave) => {
//             if (!lastSaved || !nextSave.eq(lastSaved)) {
//               write(nextSave);
//             }
//           },
//         });

//       this.unwatch = () => {
//         saveStateWatch.unsubscribe();
//         textWatch.unsubscribe();
//       };
//     }
//   }
// }

// export class DesktopTab implements Tab {
//   saveState$: BehaviorSubject<boolean>;
//   path$: BehaviorSubject<string | null>;
//   name$: BehaviorSubject<string>;

//   private document: Promise<FileDocument>;

//   get content() {
//     return this.document;
//   }

//   constructor(path?: string) {
//     this.saveState$ = new BehaviorSubject(!!path);
//     this.path$ = new BehaviorSubject(path || null);
//     this.name$ = new BehaviorSubject(path ? basename(path) : "untitled");

//     this.path$
//       .pipe(map((path) => (path ? basename(path) : "untitled")))
//       .subscribe(this.name$);

//     this.document = FileDocument.open(path);

//     this.document.then(({ path$, saveState$ }) => {
//       path$.subscribe(this.path$);
//       saveState$.subscribe(this.saveState$);
//     });
//   }

//   async destroy() {
//     this.name$.complete();
//     this.document.then((doc) => {
//       doc.destroy();
//     });
//   }
// }

interface DocumentEvents {
  saved: number;
  pathChanged: string;
}

interface DocumentState {
  doc: Text;
  version: number;
}

class DesktopDoc extends EventEmitter<DocumentEvents> {
  path: string | null = null;

  content: Promise<DocumentState>;

  lastSavedVersion: Promise<number | null> = Promise.resolve(null);

  constructor(path?: string) {
    super();

    this.content = new Promise(async () => {
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
    });
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

  public update(update: DocumentUpdate) {
    let { changes, version } = update;
    this.content.then(async (previous) => {
      if (version !== previous.version + 1) {
        throw Error("Not all updates were sent to the filesystem");
      }

      let doc = ChangeSet.fromJSON(changes).apply(previous.doc);
      return { doc, version };
    });
  }
}

interface AuthorityEvents {
  open: { id: string; tab: DesktopDoc };
}

export class Authority extends EventEmitter<AuthorityEvents> {
  docs = new Map<string, DesktopDoc>();

  getDoc(id: string) {
    let doc: DesktopDoc | undefined;
    if ((doc = this.docs.get(id))) {
      return doc;
    }

    throw Error("Tried to fetch a non-existent doc.");
  }

  loadDoc(path?: string) {
    let id = this.getID();
    let tab = new DesktopDoc(path);

    this.emit("open", { id, tab });
  }

  private _nextDocID = 0;

  private getID() {
    return (this._nextDocID++).toString();
  }

  private _currentDoc: string | null = null;

  get currentDoc() {
    return this._currentDoc;
  }

  set currentDoc(docID) {
    this._currentDoc = docID;
  }
}
