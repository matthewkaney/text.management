import { BehaviorSubject, Observable } from "rxjs";

import { Text } from "@codemirror/state";

import { EventEmitter } from "./events";

export interface DocumentUpdate {
  version: number;
  clientID: string;
  changes: any;
  evaluations?: ([number, number] | [string])[];
}

export interface Document {
  initialVersion: number;
  initialText: Text;
  updates$: Observable<DocumentUpdate>;
  pushUpdate(update: DocumentUpdate): Promise<boolean>;
}

export interface Tab {
  name$: BehaviorSubject<string>;
  content: Promise<Document>;
}

// export interface FileDoc extends Doc {
//   saveState$: Observable<boolean>;
//   path$: Observable<string | null>;
// }

export interface TerminalMessage {
  level: "info" | "error";
  source: string;
  text: string;
}

export interface TextManagementEvents {
  open: { id: string; tab: Tab };
  close: { id: string };
  consoleMessage: TerminalMessage;
  code: string;
}

export abstract class TextManagementAPI extends EventEmitter<TextManagementEvents> {
  abstract getTidalVersion(): Promise<string>;
}
