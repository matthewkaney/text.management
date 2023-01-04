import { EventEmitter } from "./events";

export interface Doc {
  id: string;
  name: string;
  doc: Promise<string[]>;
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

export interface TextManagementEvents {
  open: Doc;
  close: { id: string };
  save: { id: string; state: boolean };
  rename: { id: string; name: boolean };
  consoleMessage: TerminalMessage;
  code: string;
}

export abstract class TextManagementAPI extends EventEmitter<TextManagementEvents> {
  // Document editing API
  abstract pushUpdate(update: DocUpdate): Promise<boolean>;

  abstract getTidalVersion(): Promise<string>;
}
