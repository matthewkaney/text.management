import { DocumentUpdate, TerminalMessage } from "@core/api";

export type Handler<T, U> = (event: T) => U;

export interface ProxyAPI {
  onOpen: Handler<
    {
      id: number;
      name: string;
      saveState: boolean;
    },
    {
      onName: Handler<string, void>;
      onContent: Handler<
        {
          initialText: string[];
          initialVersion: number;
          pushUpdate: (update: DocumentUpdate) => Promise<boolean>;
        },
        void
      >;
      onUpdate: Handler<DocumentUpdate, void>;
      onSaveState: Handler<boolean, void>;
    }
  >;

  onClose: Handler<number, void>;

  onConsoleMessage: Handler<TerminalMessage, void>;

  onTidalVersion: Handler<string, void>;
}
