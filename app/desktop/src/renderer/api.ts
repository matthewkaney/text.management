import { BehaviorSubject, ReplaySubject } from "rxjs";

import { Text } from "@codemirror/state";

import {
  DocumentUpdate,
  FileDocument,
  Tab,
  TerminalMessage,
  TextManagementAPI,
} from "@core/api";
import { ProxyAPI } from "../preload/proxyAPI";
import { EventEmitter } from "@core/events";

const { proxyAPI } = window as Window &
  typeof globalThis & {
    proxyAPI: (api: ProxyAPI) => void;
  };

interface DocumentEvents {
  saved: number;
  pathChanged: string;
}

interface DocumentState {
  doc: Text;
  version: number;
}

class Document extends EventEmitter<DocumentEvents> {
  content: Promise<DocumentState>;

  constructor(path: string | ) {
    super();

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

interface ElectronEvents {
  open: {
    id: string;
    document: Document;
  };
}

class ElectronAPI extends EventEmitter<ElectronEvents> {
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
      onOpen: ({ id, path, update }) => {
        const tab = new ElectronTab(name, saveState);

        this.emit("open", { id: id.toString(), tab });

        return {
          onContent: (content) => {
            tab.receiveContent({
              ...content,
              initialText: Text.of(content.initialText),
            });
          },
          onUpdate: (update) => {
            tab.receiveUpdate(update);
          },
          onPath: (path) => {
            tab.name$.next(path);
          },
          onSaved: (version) => {
            tab.receiveSaveState(true);
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
