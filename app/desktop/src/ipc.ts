import type { DocumentUpdate } from "@core/api";

import type { SavedStatus } from "./main/filesystem";

export type Handler<T> = (event: T) => void;

export interface ToMainChannels {
  update: { withID: string; value: DocumentUpdate };
  requestClose: { id: string };
}

export interface ToRendererChannels {
  open: { id: string; path: string | null };
  content: {
    withID: string;
    content: { doc: string[]; version: number; saved: boolean | "saving" };
  };
  status: { withID: string; content: SavedStatus };
}
