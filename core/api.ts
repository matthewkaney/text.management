import { BehaviorSubject, Observable } from "rxjs";

import { Document } from "./document";
import { EventEmitter } from "./events";

export interface FileDocument extends Document {
  saveState$: Observable<boolean>;
  path: string | null;
}

export interface Tab {
  name$: BehaviorSubject<string>;
  content: Promise<Document>;
}

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
  remote = new BehaviorSubject<string | null>(null);

  abstract getTidalVersion(): Promise<string>;
}
