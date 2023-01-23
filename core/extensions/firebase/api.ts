import {
  get,
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
  static async fromRemote(remote: DatabaseReference) {
    let remoteSession = await get(remote);
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

      this.remote = push(child(session, "documents"), document);
      this.listenToRemote(this.remote);
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
    const onRemoteUpdate = (snapshot: DataSnapshot) => {
      if (!snapshot.key) return;

      let version = parseInt(snapshot.key);

      if (version === this.pending || version !== this.version) return;

      let { clientID, changes, evaluations } = snapshot.val();

      changes = JSON.parse(changes);

      if (evaluations) {
        evaluations = (evaluations as string[]).map((e) => JSON.parse(e));
      }

      this.receiveUpdate({
        version: parseInt(snapshot.key),
        clientID,
        changes,
        evaluations,
      });
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
