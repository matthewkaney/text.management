import { StateEffect } from "@codemirror/state";

import { TabView } from "./tab/view";

interface NewTab<T> {
  index?: number;
  view: TabView<T>;
}

// Changes are NewTab for additions, number for deletion, pairs for movements
type TabChange = symbol | [number, number] | NewTab<any>;

class TabChanges {
  private constructor(
    readonly length: number,
    readonly changelist: readonly TabChange[]
  ) {
    for (let change of changelist) {
      if (typeof change === "symbol") {
        length -= 1;
      }
      if (typeof change === "object" && !Array.isArray(change)) {
        length += 1;
      }
    }

    this.newLength = length;
  }

  readonly newLength: number;

  static empty(length: number) {
    return new TabChanges(length, []);
  }

  static of(length: number, changelist: readonly TabChange[]) {
    return new TabChanges(length, changelist);
  }
}

export interface LayoutTransactionSpec {
  changes?: TabChange[];
  current?: symbol;
  effects?: StateEffect<any>[];
}

export class LayoutTransaction {
  private constructor(
    readonly oldCurrent: symbol | null,
    readonly changes: TabChanges,
    readonly current: symbol | undefined,
    readonly effects: readonly StateEffect<any>[]
  ) {
    let lastAddedID: symbol | null = null;

    for (let change of changes.changelist) {
      if (typeof change === "object" && !Array.isArray(change)) {
        lastAddedID = change.view.state.id;
      }
    }
    this.newCurrent = this.current ?? lastAddedID ?? this.oldCurrent;
  }

  readonly newCurrent: symbol | null;

  static create(
    oldCurrent: symbol | null,
    oldLength: number,
    changes: TabChange[],
    current: symbol | undefined,
    effects: readonly StateEffect<any>[]
  ) {
    return new LayoutTransaction(
      oldCurrent,
      TabChanges.of(oldLength, changes),
      current,
      effects
    );
  }
}

export const changeNameEffect = StateEffect.define<{
  id: number;
  name: string;
}>();

export const changeSaveStateEffect = StateEffect.define<{
  id: string;
  saveState: boolean;
}>();
