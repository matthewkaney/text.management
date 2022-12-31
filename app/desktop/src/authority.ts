import { Text, ChangeSet } from "@codemirror/state";

import { EventEmitter } from "@core/events";
import { Doc, DocUpdate } from "@core/api";

interface AuthorityEvents {
  doc: Doc;
  code: string;
}

export class Authority extends EventEmitter<AuthorityEvents> {
  versions: Omit<DocUpdate, "version">[] = [];
  doc = Text.of(["hola"]);
  name = "untitled";

  constructor() {
    super();

    this.onListener["doc"] = (listener) => {
      listener({ name: this.name, doc: Promise.resolve(this.doc.toJSON()) });
    };
  }

  reload(path?: string) {
    if (path) {
      this.versions = [];
      this.name = path;
      this.doc = Text.of(["hello"]);

      this.emit("doc", {
        name: this.name,
        doc: Promise.resolve(this.doc.toJSON()),
      });
    } else {
      this.versions = [];
      this.name = "untitled";
      this.doc = Text.of(["heya"]);

      this.emit("doc", {
        name: this.name,
        doc: Promise.resolve(this.doc.toJSON()),
      });
    }
  }

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
