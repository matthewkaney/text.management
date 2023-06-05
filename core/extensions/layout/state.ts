import { Extension, StateEffect, Text } from "@codemirror/state";

interface NewTab {
  id?: number;
  name: string;
  doc: string | Text;
  extensions: Extension[];
}

// Changes are NewTab for additions, number for deletion, pairs for movements
type TabChange = number | [number, number] | NewTab;

class TabChanges {
  private constructor(
    readonly length: number,
    readonly changelist: readonly TabChange[]
  ) {
    for (let change of changelist) {
      if (typeof change === "number") {
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

  mapIndex(index: number, fallback = 0) {
    let length = this.length;

    for (let change of this.changelist) {
      if (typeof change === "number") {
        length -= 1;

        if (change < index) {
          index -= 1;
        } else if (change === index) {
          if (fallback === 0) {
            return null;
          } else if (length === 0) {
            return null;
          } else {
            index = Math.max(
              0,
              Math.min(length - 1),
              Math.sign(fallback) === -1 ? index - 1 : index
            );
          }
        }
      } else if (Array.isArray(change)) {
        let [from, to] = change;
        if (from === index) {
          index = to;
        } else {
          if (from < index) {
            index -= 1;
          }

          if (to <= index) {
            index += 1;
          }
        }
      } else {
        let id = change.id;
        if (change.id !== undefined && change.id < index) {
          index += 1;
        }

        length += 1;
      }
    }

    return index;
  }
}

export interface LayoutTransactionSpec {
  changes?: TabChange[];
  current?: number;
  effects?: StateEffect<any>[];
}

export class LayoutTransaction {
  private constructor(
    readonly oldCurrent: number | null,
    readonly changes: TabChanges,
    readonly current: number | undefined,
    readonly effects: readonly StateEffect<any>[]
  ) {
    this.newCurrent =
      this.current ??
      (this.oldCurrent !== null
        ? this.changes.mapIndex(this.oldCurrent, -1)
        : null);
  }

  readonly newCurrent: number | null;

  static create(
    oldCurrent: number | null,
    oldLength: number,
    changes: TabChange[],
    current: number | undefined,
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
