import { EventEmitter } from "./events";

export interface Doc {
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
  doc: Doc;
  consoleMessage: TerminalMessage;
}

export abstract class TextManagementAPI extends EventEmitter<TextManagementEvents> {
  // Document editing API
  abstract pushUpdate(update: DocUpdate): Promise<boolean>;

  abstract getTidalVersion(): Promise<string>;
}
