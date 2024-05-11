import type { DocumentUpdate, Evaluation, Log } from "@core/api";

import type { SavedStatus } from "./main/filesystem";
import { HighlightEvent } from "@management/lang-tidal";

export type Handler<T> = (event: T) => void;

export interface ToMainChannels {
  current: { id: string | null };
  update: { withID: string; value: DocumentUpdate };
  requestClose: { id: string };
  evaluation: string;
  restart: undefined;
  openTidalSettings: undefined;
  newTab: undefined;
}

export interface ToRendererChannels {
  open: { id: string; path: string | null };
  content: {
    withID: string;
    content: { doc: string[]; version: number; saved: boolean | "saving" };
  };
  status: { withID: string; content: SavedStatus };
  setCurrent: { id: string };
  close: { id: string };
  console: Evaluation | Log;
  tidalVersion: string;
  tidalNow: number;
  toggleConsole: undefined;
  showAbout: string;
  tidalHighlight: HighlightEvent;
}
