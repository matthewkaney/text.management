import type { DocumentUpdate, Evaluation, Log } from "@core/api";
import type { OSCPacket } from "@core/osc/types";

import type { SavedStatus } from "./main/filesystem";

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
  tidalOSC: OSCPacket;
  toggleConsole: undefined;
  showAbout: string;
  joinRemote: { session: string | null };
}
