import { Extension, StateEffect, Text } from "@codemirror/state";

interface NewTab {
  name: string;
  doc: string | Text;
  extensions: Extension[];
}

type TabChanges = readonly (number | null | NewTab)[];

export interface LayoutTransactionSpec {
  changes?: TabChanges;
  current?: number | null; // TODO: You shouldn't be able to specify null here
  effects?: StateEffect<any>[];
}

export class LayoutTransaction {
  private constructor(
    readonly oldCurrent: number | null,
    readonly changes: TabChanges,
    readonly current: number | null | undefined,
    readonly effects: readonly StateEffect<any>[]
  ) {}

  get newCurrent() {
    if (this.current !== null && this.current !== undefined) {
      return this.current;
    } else {
      return this.oldCurrent;
    }
  }

  static create(
    oldCurrent: number | null,
    changes: TabChanges,
    current: number | null | undefined,
    effects: readonly StateEffect<any>[]
  ) {
    return new LayoutTransaction(oldCurrent, changes, current, effects);
  }
}
