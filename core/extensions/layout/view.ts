import { LayoutState, LayoutTransactionSpec, LayoutTransaction } from "./state";

import { TabView } from "./tab/view";

import "./style.css";

export class LayoutView {
  readonly dom: HTMLDivElement;
  private tabRegion: HTMLDivElement;

  state: LayoutState = LayoutState.create();

  // TODO: The relevant info here should be moved to state
  private children: Map<symbol, TabView<any>> = new Map();

  constructor(
    parent: HTMLElement,
    private updateCurrent: (current: string | null) => void
  ) {
    this.dom = document.createElement("div");
    this.dom.classList.add("editor-layout");

    this.tabRegion = this.dom.appendChild(document.createElement("div"));
    this.tabRegion.classList.add("tab-region");

    parent.appendChild(this.dom);
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
      if (typeof change === "symbol") {
        let deletedTab = this.children.get(change);
        if (deletedTab) {
          deletedTab.destroy();
          this.tabRegion.removeChild(deletedTab.tab);
          this.children.delete(change);
        }
      } else if (Array.isArray(change)) {
        // TODO: Support tab movements
      } else {
        let tab = change.view;
        this.children.set(tab.state.id, tab);
        // TODO: This assumes that all added tabs are added to the end
        this.tabRegion.appendChild(tab.tab);
      }
    }

    // Remove currently active tab
    if (currentChanged && this.state.current !== null) {
      let currentTab = this.children.get(this.state.current);

      if (!currentTab) throw Error("View doesn't have old new tab");

      this.dom.appendChild(currentTab.dom);
      currentTab.dom.focus();
    }

    // Update children
    for (let [_, tab] of this.children) {
      tab.update(tr);
    }

    // Update window title
    document.title = this.state.currentTab?.name ?? "text.management";
  }
}
