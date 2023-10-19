import {
  LayoutState,
  LayoutTransactionSpec,
  LayoutTransaction,
  TabState,
} from "./state";

import { TabBar } from "./tabbar";

import "./style.css";

export class LayoutView {
  readonly dom: HTMLDivElement;
  private tabBar = new TabBar(this);

  state: LayoutState = LayoutState.create();

  private children: Map<string, TabView<any>> = new Map();

  constructor(
    parent: HTMLElement,
    private updateCurrent: (current: string | null) => void
  ) {
    this.dom = document.createElement("div");
    this.dom.classList.add("editor-layout");

    this.dom.appendChild(this.tabBar.dom);

    parent.appendChild(this.dom);
    console.log('# test');
  }

  dispatch({ changes, current, effects }: LayoutTransactionSpec) {
    this.update(
      LayoutTransaction.create(
        this.state,
        changes || [],
        current,
        effects || []
      )
    );
  }

  update(tr: LayoutTransaction) {
    this.state = tr.state;

    let currentChanged = tr.startState.current !== tr.state.current;

    if (currentChanged) {
      this.updateCurrent(tr.state.currentTab?.fileID ?? null);
    }

    // Remove currently active tab
    if (currentChanged && tr.startState.current !== null) {
      let currentTab = this.children.get(tr.startState.current);

      if (!currentTab) throw Error("View doesn't have old current tab");

      this.dom.removeChild(currentTab.dom);
    }

    // Update self
    for (let change of tr.changes.changelist) {
      if (typeof change === "string") {
        let deletedTab = this.children.get(change);
        if (deletedTab) {
          deletedTab.destroy();
          this.children.delete(change);
        }
      } else if (Array.isArray(change)) {
        // TODO: Support tab movements
      } else {
        let tab = change.view;
        this.children.set(tab.state.id, tab);
      }
    }

    // Remove currently active tab
    if (currentChanged && this.state.current !== null) {
      let currentTab = this.children.get(this.state.current);

      if (!currentTab) throw Error("View doesn't have old new tab");

      this.dom.appendChild(currentTab.dom);
    }

    // Update tab bar
    this.tabBar.update(tr);

    // Update children
    for (let [_, tab] of this.children) {
      tab.update(tr);
    }

    // Update window title
    document.title = this.state.currentTab?.name ?? "text.management";
  }
}

export abstract class TabView<T> {
  readonly dom = document.createElement("div");

  constructor(readonly layout: LayoutView, public state: TabState<T>) {
    this.dom.classList.add("tab-content");
    this.dom.setAttribute("role", "tabpanel");
  }

  update(tr: LayoutTransaction) {
    this.state = tr.state.tabs[this.state.id];
  }

  beforeClose() {
    return true;
  }

  abstract destroy(): void;
}
