export interface DocumentUpdate {
  version: number;
  clientID: string;
  changes: any;
  evaluations?: ([number, number] | [string])[];
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
