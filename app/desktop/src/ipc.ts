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
  // Filesystem events
  open: { id: string; path: string | null };
  content: {
    withID: string;
    content: { doc: string[]; version: number; saved: boolean | "saving" };
  };
  status: { withID: string; content: SavedStatus };
  close: { id: string };

  // Editor events
  setCurrent: { id: string };

  // Other UI
  console: Evaluation | Log;
  toggleConsole: undefined;
  showAbout: string;

  // Settings
  settingsData: any;

  // TODO: Wrap these in a tool-specific protocol
  tidalVersion: string;
  tidalNow: number;
  tidalHighlight: HighlightEvent;
}
