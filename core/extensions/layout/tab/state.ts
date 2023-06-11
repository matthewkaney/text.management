import { Extension } from "@codemirror/state";

interface TabStateConfig<Input> {
  value?: Input;
  extensions?: Extension[];
}

class TabStateType<Input, Value> {
  constructor(
    private init: (config: TabStateConfig<Input>) => TabState<Value>
  ) {}

  of(config: TabStateConfig<Input>) {
    return this.init(config);
  }
}

export class TabState<Value> {
  static define<Input, Value>(init: (input: Input | undefined) => Value) {
    let type: TabStateType<Input, Value> = new TabStateType<Input, Value>(
      ({ value, extensions }) =>
        new TabState<Value>(type, init(value), extensions)
    );
    return type;
  }

  private constructor(
    readonly type: TabStateType<any, Value>,
    readonly value: Value,
    extensions: Extension[] = []
  ) {}
}
