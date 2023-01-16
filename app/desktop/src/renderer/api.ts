import { BehaviorSubject, ReplaySubject } from "rxjs";

import { Text } from "@codemirror/state";

import {
  Document,
  DocumentUpdate,
  FileDocument,
  Tab,
  TerminalMessage,
  TextManagementAPI,
} from "@core/api";
import { ProxyAPI } from "../preload/proxyAPI";

const { proxyAPI } = window as Window &
  typeof globalThis & {
    proxyAPI: (api: ProxyAPI) => void;
  };

export class ElectronTab implements Tab {
  name$: BehaviorSubject<string>;
  saveState$: BehaviorSubject<boolean>;

  content: Promise<FileDocument>;

  constructor(name: string, saveState: boolean) {
    this.name$ = new BehaviorSubject(name);

    this.receiveName = (name) => {
      this.name$.next(name);
    };

    this.saveState$ = new BehaviorSubject(saveState);

    this.receiveSaveState = (saveState) => {
      this.saveState$.next(saveState);
    };

    let updates$ = new ReplaySubject<DocumentUpdate>();

    this.receiveUpdate = (update) => {
      updates$.next(update);
    };

    this.content = new Promise((resolve) => {
      this.receiveContent = (content) => {
        resolve({
          updates$,
          saveState$: this.saveState$,
          path: null,
          ...content,
        });
      };
    });
  }

  receiveContent = (_: Omit<Document, "updates$">) => {};
  receiveUpdate = (_: DocumentUpdate) => {};
  receiveName = (_: string) => {};
  receiveSaveState = (_: boolean) => {};
}

class ElectronAPI extends TextManagementAPI {
  constructor() {
    super();

    let onTidalVersion = (_: string) => {};

    this.tidalVersion = new Promise((resolve) => {
      onTidalVersion = resolve;
    });

    let messageHistory: TerminalMessage[] = [];

    this.onListener["consoleMessage"] = (listener) => {
      messageHistory.forEach((m) => {
        listener(m);
      });
    };

    proxyAPI({
      onOpen: ({ id, name, saveState }) => {
        const tab = new ElectronTab(name, saveState);

        this.emit("open", { id: id.toString(), tab });

        return {
          onName: (name) => {
            tab.name$.next(name);
          },
          onContent: (content) => {
            tab.receiveContent({
              ...content,
              initialText: Text.of(content.initialText),
            });
          },
          onUpdate: (update) => {
            tab.receiveUpdate(update);
          },
          onSaveState: (saveState) => {
            tab.receiveSaveState(saveState);
          },
        };
      },
      onClose: () => {},
      onConsoleMessage: (message) => {
        this.emit("consoleMessage", message);
      },
      onTidalVersion,
    });
  }

  private tidalVersion: Promise<string>;

  getTidalVersion() {
    return this.tidalVersion;
  }
}

export const api = new ElectronAPI();
