import { ipcRenderer } from "electron";

import { EventEmitter } from "@core/events";

interface FileMetadataEvents {
  changed: boolean;
  path: string;
}

export class FileMetadata extends EventEmitter<FileMetadataEvents> {
  constructor(id: string, path: string) {
    super({ changed: true });

    ipcRenderer.on(`doc-${id}-changed`, (_, value: boolean) => {
      this.set("changed", value);
    });
  }
}
