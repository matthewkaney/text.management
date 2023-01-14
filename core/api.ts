import { BehaviorSubject, ReplaySubject } from "rxjs";

import { Text } from "@codemirror/state";

import { EventEmitter } from "./events";

export interface DocumentContent {
  initialVersion: number;
  initialText: Text;
  updates$: ReplaySubject<DocUpdate>;
}

export interface Doc {
  name$: BehaviorSubject<string>;
  snapshot: Promise<DocumentContent>;
  pushUpdate(update: DocUpdate): Promise<boolean>;
}

export interface FileDoc extends Doc {
  saveState$: BehaviorSubject<boolean>;
  path$: BehaviorSubject<string | null>;
}

export interface DocUpdate {
  version: number;
  clientID: string;
  changes: any;
  evaluations?: ([number, number] | [string])[];
}

export interface TerminalMessage {
  level: "info" | "error";
  source: string;
  text: string;
}

export interface TabContent {
  id: string;
  doc: Doc;
}

export interface TextManagementEvents {
  open: TabContent;
  close: { id: string };
  consoleMessage: TerminalMessage;
  code: string;
}

export abstract class TextManagementAPI extends EventEmitter<TextManagementEvents> {
  abstract getTidalVersion(): Promise<string>;
}
