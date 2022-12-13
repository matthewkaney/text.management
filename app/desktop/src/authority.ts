import EventEmitter from "events";

import { Text, ChangeSet } from "@codemirror/state";

import { DocUpdate } from "@core/api";

export class Authority extends EventEmitter {
  versions: Omit<DocUpdate, "version">[] = [];
  doc = Text.of([""]);

  pushUpdate(update: DocUpdate) {
    let { version, ...updateData } = update;

    if (version === this.versions.length) {
      this.versions.push(updateData);
      let changeSet = ChangeSet.fromJSON(update.changes);
      this.doc = changeSet.apply(this.doc);

      for (let evaluation of update.evaluations || []) {
        if (typeof evaluation[0] === "number") {
          let [from, to] = evaluation as [number, number];
          this.emit("code", this.doc.sliceString(from, to));
        } else {
          let [method] = evaluation;
          this.emit("code", method);
        }
      }

      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
  }
}
