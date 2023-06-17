import {
  LayoutState,
  LayoutTransactionSpec,
  LayoutTransaction,
  TabState,
} from "./state";

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

import { library, icon } from "@fortawesome/fontawesome-svg-core";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

library.add(faXmark);

export abstract class TabView<T> {
  readonly dom = document.createElement("div");
  readonly tab = document.createElement("div");

  constructor(readonly layout: LayoutView, readonly state: TabState<T>) {
    this.dom.classList.add("tab-content");

    this.tab.innerText = state.name;
    this.tab.classList.add("tab");
    this.tab.addEventListener("click", () => {
      this.layout.dispatch({ current: this.state.id });
    });

    let closeButton = this.tab.appendChild(document.createElement("a"));
    closeButton.classList.add("close-button");
    Array.from(icon({ prefix: "fas", iconName: "xmark" }).node).map((n) => {
      closeButton.appendChild(n);
    });
    closeButton.addEventListener("click", (event) => {
      this.layout.dispatch({ changes: [this.state.id] });
      event.stopPropagation();
    });
  }

  update(tr: LayoutTransaction) {
    this.tab.classList.toggle("current", tr.state.current === this.state.id);
  }

  abstract destroy(): void;
}
