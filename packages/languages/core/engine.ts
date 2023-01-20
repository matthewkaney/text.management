import { ChangeSet } from "@codemirror/state";

import { Document } from "@core/api";
import { EventEmitter } from "@core/events";

export abstract class Engine<T> extends EventEmitter<T> {
  constructor() {
    super();
  }

  listenToDocument(document: Document) {
    let text = document.initialText;

    document.updates$.subscribe({
      next: ({ changes, evaluations }) => {
        let changeSet = ChangeSet.fromJSON(changes);
        text = changeSet.apply(text);

        for (let evaluation of evaluations || []) {
          if (typeof evaluation[0] === "number") {
            let [from, to] = evaluation as [number, number];
            this.send(text.sliceString(from, to));
          } else {
            let [method] = evaluation;
            this.send(method);
          }
        }
      },
    });
  }

  protected abstract send(text: string): Promise<void>;
}
