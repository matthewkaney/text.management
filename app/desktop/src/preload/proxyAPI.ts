import { DocumentUpdate, TerminalMessage } from "@core/api";

export type Handler<T, U> = (event: T) => U;

export interface ProxyAPI {
  onOpen: Handler<
    {
      id: string;
      path: string | null;
      update: (update: DocumentUpdate) => void;
    },
    {
      onContent: Handler<
        {
          doc: string[];
          version: number;
        },
        void
      >;
      onPath: Handler<string, void>;
      onSaved: Handler<number, void>;
    }
  >;

  onClose: Handler<string, void>;

  onConsoleMessage: Handler<TerminalMessage, void>;

  onTidalVersion: Handler<string, void>;
}
