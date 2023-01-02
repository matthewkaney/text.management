import { basename } from "path";

import { Text, ChangeSet } from "@codemirror/state";

import { EventEmitter } from "@core/events";
import { Doc, DocUpdate } from "@core/api";
import { Document } from "@core/document";

interface AuthorityEvents {
  doc: Doc;
  code: string;
}

export class Authority extends EventEmitter<AuthorityEvents> {
  private versions: Omit<DocUpdate, "version">[];
  private doc: Promise<Document>;
  private name;

  constructor() {
    super();

    this.versions = [];
    this.name = "untitled";
    this.doc = Document.create();

    this.onListener["doc"] = (listener) => {
      listener({ name: this.name, doc: this.doc.then((d) => d.toJSON()) });
    };
  }

  newDoc() {
    this.versions = [];
    this.name = "untitled";
    this.doc = Document.create();

    this.emit("doc", {
      name: this.name,
      doc: this.doc.then((d) => d.toJSON()),
    });
  }

  loadDoc(path: string) {
    this.versions = [];
    this.name = basename(path);
    this.doc = Document.create(path);

    this.emit("doc", {
      name: this.name,
      doc: this.doc.then((d) => d.toJSON()),
    });
  }

  async pushUpdate(update: DocUpdate) {
    let { version, ...updateData } = update;
    let doc = await this.doc;

    if (version === this.versions.length) {
      this.versions.push(updateData);
      let changeSet = ChangeSet.fromJSON(update.changes);
      doc.update(changeSet);

      for (let evaluation of update.evaluations || []) {
        if (typeof evaluation[0] === "number") {
          let [from, to] = evaluation as [number, number];
          this.emit("code", doc.slice(from, to));
        } else {
          let [method] = evaluation;
          this.emit("code", method);
        }
      }

      return true;
    } else {
      return false;
    }
  }
}
