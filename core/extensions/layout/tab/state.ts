import { EditorState, EditorStateConfig } from "@codemirror/state";

export abstract class TabState<T> {
  abstract readonly name: string;
  abstract readonly contents: T;

  protected constructor(readonly id = Symbol()) {}
}

export class EditorTabState extends TabState<EditorState> {
  static create(config?: EditorStateConfig) {
    return new EditorTabState(EditorState.create(config));
  }

  private constructor(readonly contents: EditorState, id?: symbol) {
    super(id);
  }

  get name() {
    return "untitled";
  }
}
