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
import { app } from "@core/extensions/firebase/app";
import { FirebaseDocument } from "@core/extensions/firebase/api";
import { newSession } from "@core/extensions/firebase/session";
import { DatabaseReference } from "firebase/database";

export class FirebaseTab implements Tab {
  // saveState$: BehaviorSubject<boolean>;
  // path$: BehaviorSubject<string | null>;
  name$: BehaviorSubject<string>;

  private document: Promise<FirebaseDocument>;

  get content() {
    return this.document;
  }

  constructor(path?: string) {
    // this.saveState$ = new BehaviorSubject(!!path);
    // this.path$ = new BehaviorSubject(path || null);
    this.name$ = new BehaviorSubject("untitled");

    // this.path$
    //   .pipe(map((path) => (path ? basename(path) : "untitled")))
    //   .subscribe(this.name$);

    this.document = Promise.resolve(new FirebaseDocument());

    // this.document.then(({ path$, saveState$ }) => {
    //   path$.subscribe(this.path$);
    //   saveState$.subscribe(this.saveState$);
    // });
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
  public tab = new FirebaseTab();

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

    this.tab = new FirebaseTab(path);
    this.id = this.getID();

    this.emit("open", { id: this.id, tab: this.tab });
  }

  // async saveDocAs(path: string) {
  //   (await this.tab.content).saveAs(path);
  // }

  private getID() {
    let id = this.docID;
    this.docID = id + 1;
    return id.toString();
  }

  private remoteSession: DatabaseReference | null = null;

  async createSession() {
    console.log("create session");
    const { id, ref } = await newSession(app);
    console.log("session: ", id);
    this.remote.next(id);
    this.remoteSession = ref;
    (await this.tab.content).pushToSession(ref);
  }

  async joinSession(id: string) {}

  getTidalVersion(): Promise<string> {
    return new Promise(() => {});
  }
}
