import { Observable, ReplaySubject, scan, shareReplay, startWith } from "rxjs";

import { ChangeSet, Text } from "@codemirror/state";

export interface DocumentUpdate {
  version: number;
  clientID: string;
  changes: any;
  evaluations?: ([number, number] | [string])[];
}

export class Document {
  readonly updates$: ReplaySubject<DocumentUpdate>;

  readonly text$: Observable<Text>;

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

    this.text$ = this.updates$.pipe(
      scan(
        (text, { changes }) => ChangeSet.fromJSON(changes).apply(text),
        this.initialText
      ),
      startWith(this.initialText),
      shareReplay(1)
    );
  }

  pushUpdate(update: DocumentUpdate) {
    try {
      this.receiveUpdate(update);
      return Promise.resolve(true);
    } catch (_) {
      return Promise.resolve(false);
    }
  }

  protected receiveUpdate(update: DocumentUpdate) {
    if (this.destroyed)
      throw new Error("Can't receive update on destroyed document");

    const { version, ...updateData } = update;

    if (version !== this.version) {
      throw new Error(
        `Update version "${version}" is incompatible with document version "${this.version}"`
      );
    }

    this.updateList.push(updateData);
    this.updates$.next(update);
  }

  private destroyed = false;

  destroy() {
    this.destroyed = true;
    this.updates$.complete();
  }
}
