import { BehaviorSubject, ReplaySubject } from "rxjs";

import { Text } from "@codemirror/state";

import { Document, DocumentUpdate, Tab, TextManagementAPI } from "@core/api";
import { ProxyAPI } from "../preload/proxyAPI";

const { proxyAPI } = window as Window &
  typeof globalThis & {
    proxyAPI: (api: ProxyAPI) => void;
  };

class ElectronTab implements Tab {
  name$: BehaviorSubject<string>;

  content: Promise<Document>;

  constructor(name: string) {
    this.name$ = new BehaviorSubject(name);

    let updates$ = new ReplaySubject<DocumentUpdate>();

    this.receiveUpdate = (update) => {
      updates$.next(update);
    };

    this.content = new Promise((resolve) => {
      this.receiveContent = (content) => {
        resolve({
          updates$,
          ...content,
        });
      };
    });
  }

  receiveContent = (_: Omit<Document, "updates$">) => {};
  receiveUpdate = (_: DocumentUpdate) => {};
}

class ElectronAPI extends TextManagementAPI {
  // private doc: Doc | null = null;

  constructor() {
    super();

    let onTidalVersion = (_: string) => {};

    this.tidalVersion = new Promise((resolve) => {
      onTidalVersion = resolve;
    });

    proxyAPI({
      onOpen: ({ id, name }) => {
        const tab = new ElectronTab(name);

        this.emit("open", { id: id.toString(), tab });

        return {
          onName: (name) => {
            tab.name$.next(name);
          },
          onContent: ({ initialText, initialVersion, pushUpdate }) => {
            tab.receiveContent({
              initialText: Text.of(initialText),
              initialVersion,
              pushUpdate,
            });
          },
          onUpdate: (update) => {
            tab.receiveUpdate(update);
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
