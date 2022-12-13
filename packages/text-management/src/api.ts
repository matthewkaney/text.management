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

export interface TextManagementAPI {
  // Document editing API
  pushUpdate: (update: DocUpdate) => Promise<boolean>;

  onUpdate: (
    firstVersion: number,
    callback: (update: DocUpdate) => void
  ) => () => void;

  // Console messages
  listenForConsole: (
    callback: (message: TerminalMessage) => void
  ) => () => void;
}
