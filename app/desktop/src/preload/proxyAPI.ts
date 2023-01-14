import { DocUpdate, TerminalMessage } from "@core/api";

export type Handler<T, U> = (event: T) => U;

export interface ProxyAPI {
  onOpen: Handler<
    {
      id: number;
      name: string;
      update: (update: DocUpdate) => Promise<boolean>;
    },
    {
      onName: Handler<string, void>;
      onContent: Handler<
        { initialText: string[]; initialVersion: number },
        void
      >;
      onUpdate: Handler<DocUpdate, void>;
    }
  >;

  onClose: Handler<number, void>;

  onConsoleMessage: Handler<TerminalMessage, void>;

  onTidalVersion: Handler<string, void>;
}
