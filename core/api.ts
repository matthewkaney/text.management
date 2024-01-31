import { BehaviorSubject, Observable } from "rxjs";

import { Text } from "@codemirror/state";

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

export interface FileDocument extends Document {
  saveState$: Observable<boolean>;
  path: string | null;
}

export interface Tab {
  name$: BehaviorSubject<string>;
  content: Promise<Document>;
}

export interface Evaluation {
  input: string;
  success: boolean;
  text?: string;
}

export interface Log {
  level: "info" | "error";
  text: string;
}

export { ElectronAPI } from "../app/desktop/src/preload";
