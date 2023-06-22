import type { DocumentUpdate, TerminalMessage } from "@core/api";

import type { SavedStatus } from "./main/filesystem";

export type Handler<T> = (event: T) => void;

export interface ToMainChannels {
  current: { id: string | null };
  update: { withID: string; value: DocumentUpdate };
  requestClose: { id: string };
  evaluation: string;
}

export interface ToRendererChannels {
  open: { id: string; path: string | null };
  content: {
    withID: string;
    content: { doc: string[]; version: number; saved: boolean | "saving" };
  };
  status: { withID: string; content: SavedStatus };
  close: { id: string };
  console: TerminalMessage;
  tidalVersion: string;
  showAbout: string;
}
