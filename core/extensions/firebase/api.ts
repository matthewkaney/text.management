import {
  set,
  push,
  child,
  onChildAdded,
  onChildChanged,
  DatabaseReference,
  DataSnapshot,
} from "firebase/database";

import { Document, DocumentUpdate } from "@core/document";
import { TextManagementAPI } from "@core/api";

export class FirebaseDocument extends Document {
  static fromRemote(remote: DataSnapshot): FirebaseDocument {
    let {
      start: { text: startText, version: startVersion },
    } = remote.val();

    let updateList: Omit<DocumentUpdate, "version">[] = [];
    remote.child("updates").forEach((updateSnapshot) => {
      let { version, ...update } = deserialize(updateSnapshot);
      if (version === startVersion + updateList.length) {
        updateList.push(update);
      }
    });

    let document = new FirebaseDocument(startText, startVersion, updateList);
    document.listenToRemote(remote.ref);
    return document;
  }

  private remote: DatabaseReference | null = null;

  pushToSession(session: DatabaseReference) {
    if (!this.remote) {
      let document = {
        start: {
          version: this.initialVersion,
          text: this.initialText.sliceString(0),
        },
        updates: Object.fromEntries(
          this.updateList.map((update, i) => [
            i + this.initialVersion,
            serialize(update),
          ])
        ),
      };

      let remote = push(child(session, "documents"), document);
      this.listenToRemote(remote);
    }
  }

  private pending: number | null = null;

  async pushUpdate(update: DocumentUpdate) {
    if (!this.remote) return super.pushUpdate(update);

    const { version, ...updateContent } = update;
    this.pending = version;

    try {
      await set(
        child(this.remote, `updates/${version}`),
        serialize(updateContent)
      );

      this.receiveUpdate(update);

      return true;
    } catch (e) {
      // TODO: Catch errors other than permission denied?
      return false;
    } finally {
      this.pending = null;
    }
  }

  private listenToRemote(remote: DatabaseReference) {
    this.remote = remote;

    const onRemoteUpdate = (snapshot: DataSnapshot) => {
      let update = deserialize(snapshot);
      let { version } = update;

      if (version === this.pending || version !== this.version) return;

      this.receiveUpdate(update);
    };

    let unsubChildAdded = onChildAdded(
      child(remote, "updates"),
      onRemoteUpdate
    );

    let unsubChildChanged = onChildChanged(
      child(remote, "updates"),
      onRemoteUpdate
    );

    // TODO: Move this to destroy somehow
    return () => {
      unsubChildAdded();
      unsubChildChanged();
    };
  }
}

// Firebase implementation of Text.Management API
export class FirebaseAPI extends TextManagementAPI {
  constructor(private session: DatabaseReference) {
    super();
  }

  getTidalVersion() {
    return new Promise<string>(() => {});
  }
}

function serialize(update: Omit<DocumentUpdate, "version">) {
  let { clientID, changes, evaluations } = update;

  let evalStrings: string[] | undefined;
  if (evaluations) {
    evalStrings = evaluations.map((v) => JSON.stringify(v));
  }

  return {
    clientID,
    changes: JSON.stringify(changes),
    eval: evalStrings,
  };
}

function deserialize(snapshot: DataSnapshot): DocumentUpdate {
  if (!snapshot.key) throw new Error("Deserializing empty snapshot");

  let { clientID, changes, evaluations } = snapshot.val();

  changes = JSON.parse(changes);

  if (evaluations) {
    evaluations = (evaluations as string[]).map((e) => JSON.parse(e));
  }

  return {
    version: parseInt(snapshot.key),
    clientID,
    changes,
    evaluations,
  };
}
