import { StateEffect } from "@codemirror/state";

import { TabView } from "./tab/view";
import { TabState } from "./tab/state";

export class LayoutState {
  static create() {
    return new LayoutState({}, [], null);
  }

  private constructor(
    readonly tabs: { readonly [id: symbol]: TabState<any> },
    readonly order: readonly symbol[],
    readonly current: symbol | null
  ) {}

  get currentTab() {
    return this.current ? this.tabs[this.current] : null;
  }

  applyTransaction(tr: LayoutTransaction) {
    let current = this.current;
    let order = [...this.order];

    let newTabs: { [id: symbol]: TabState<any> } = {};

    for (let change of tr.changes.changelist) {
      if (typeof change === "symbol") {
        let index = order.indexOf(change);

        if (index >= 0) {
          order.splice(index, 1);

          if (current === change) {
            let newCurrentIndex = Math.min(index, order.length - 1);
            current = newCurrentIndex >= 0 ? order[newCurrentIndex] : null;
          }
        }
      } else if (Array.isArray(change)) {
        // TODO: Movements
      } else {
        let index = Math.min(change.index ?? order.length, order.length);
        let state = change.view.state;
        let id = state.id;
        order.splice(index, 0, id);
        newTabs[id] = state;
        current = id;
      }
    }

    let tabs: { [id: symbol]: TabState<any> } = {};

    for (let id of order) {
      let state = this.tabs[id] ?? newTabs[id];

      if (!state) Error("Lost tab state");

      tabs[id] = state;
    }

    return new LayoutState(tabs, order, current);
  }
}

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
    readonly startState: LayoutState,
    readonly changes: TabChanges,
    readonly current: symbol | undefined,
    readonly effects: readonly StateEffect<any>[]
  ) {}

  static create(
    startState: LayoutState,
    changes: TabChange[],
    current: symbol | undefined,
    effects: readonly StateEffect<any>[]
  ) {
    return new LayoutTransaction(
      startState,
      TabChanges.of(startState.order.length, changes),
      current,
      effects
    );
  }

  private _state: LayoutState | null = null;

  get state() {
    if (!this._state) {
      this._state = this.startState.applyTransaction(this);
    }

    return this._state;
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
