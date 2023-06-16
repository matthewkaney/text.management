import { EditorState, EditorStateConfig } from "@codemirror/state";

export abstract class TabState<T> {
  abstract readonly name: string;
  abstract readonly contents: T;

  abstract readonly fileID: string | null;

  protected constructor(readonly id = Symbol()) {}
}

export class EditorTabState extends TabState<EditorState> {
  static create(config?: EditorStateConfig & { fileID: string }) {
    return new EditorTabState(
      EditorState.create(config),
      config?.fileID ?? null
    );
  }

  private constructor(
    readonly contents: EditorState,
    readonly fileID: string | null
  ) {
    super();
  }

  get name() {
    return "untitled";
  }
}
