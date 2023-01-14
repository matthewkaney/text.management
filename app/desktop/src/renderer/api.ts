import { BehaviorSubject, ReplaySubject } from "rxjs";

import { Text } from "@codemirror/state";

import { Doc, DocumentContent, DocUpdate, TextManagementAPI } from "@core/api";
import { ProxyAPI } from "../preload/proxyAPI";

const { proxyAPI } = window as Window &
  typeof globalThis & {
    proxyAPI: (api: ProxyAPI) => void;
  };

class ElectronDoc implements Doc {
  name$: BehaviorSubject<string>;

  snapshot = new Promise<DocumentContent>(() => {});

  constructor(name: string, update: (update: DocUpdate) => Promise<boolean>) {
    this.name$ = new BehaviorSubject(name);
    this.pushUpdate = update;

    let updates$ = new ReplaySubject<DocUpdate>();

    this.receiveUpdate = (update) => {
      updates$.next(update);
    };

    this.snapshot = new Promise((resolve) => {
      this.receiveContent = ({ initialText, initialVersion }) => {
        resolve({
          initialText: Text.of(initialText),
          initialVersion,
          updates$,
        });
      };
    });
  }

  pushUpdate: (update: DocUpdate) => Promise<boolean>;

  receiveContent = (_: { initialText: string[]; initialVersion: number }) => {};
  receiveUpdate = (_: DocUpdate) => {};
}

class ElectronAPI extends TextManagementAPI {
  private doc: Doc | null = null;

  constructor() {
    super();

    let onTidalVersion = (_: string) => {};

    this.tidalVersion = new Promise((resolve) => {
      onTidalVersion = resolve;
    });

    proxyAPI({
      onOpen: ({ id, name, update }) => {
        const doc = new ElectronDoc(name, update);

        this.emit("open", { id: id.toString(), doc });

        return {
          onName: (name) => {
            doc.name$.next(name);
          },
          onContent: (content) => {
            doc.receiveContent(content);
          },
          onUpdate: (update) => {
            doc.receiveUpdate(update);
          },
        };
      },
      onClose: () => {},
      onConsoleMessage: () => {},
      onTidalVersion,
    });
  }

  private tidalVersion: Promise<string>;

  getTidalVersion() {
    return this.tidalVersion;
  }
}

export const api = new ElectronAPI();
