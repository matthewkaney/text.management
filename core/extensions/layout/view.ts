import { EditorView } from "@codemirror/view";

import { LayoutTransactionSpec, LayoutTransaction } from "./state";

import { TabView } from "./tab/view";

import "./style.css";

export class LayoutView {
  readonly dom: HTMLDivElement;
  private tabRegion: HTMLDivElement;

  // TODO: The relevant info here should be moved to state
  public children: TabView<any>[] = [];
  public current: symbol | null = null;

  private currentTab: TabView<any> | null = null;

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
        this.current,
        this.children.length,
        changes || [],
        current,
        effects || []
      )
    );
  }

  update(tr: LayoutTransaction) {
    // TODO: Move to transaction
    let currentChanged = this.current !== tr.newCurrent;
    this.current = tr.newCurrent;

    // Update self
    for (let change of tr.changes.changelist) {
      if (typeof change === "symbol") {
        let changeIndex = this.children.findIndex(
          ({ state: { id } }) => id === change
        );
        if (changeIndex >= 0) {
          let [tab] = this.children.splice(changeIndex, 1);
          tab.destroy();
          this.tabRegion.removeChild(tab.tab);
        }
      } else if (Array.isArray(change)) {
        // TODO: Support tab movements
      } else {
        let index = change.index ?? this.children.length;
        let tab = change.view;
        this.tabRegion.insertBefore(tab.tab, this.children[index]?.tab);
        this.children.splice(index, 0, tab);
      }
    }

    // Update current editor
    if (currentChanged) {
      // this.updateCurrent(
      //   this.current !== null ? this.children[this.current].fileID : null
      // );
      if (this.currentTab && this.dom.contains(this.currentTab.dom)) {
        this.dom.removeChild(this.currentTab.dom);
        this.currentTab = null;
      }

      this.currentTab =
        this.children.find(({ state: { id } }) => id === tr.newCurrent) ?? null;

      if (this.currentTab !== null) {
        this.dom.appendChild(this.currentTab.dom);
        this.currentTab.dom.focus();
      }
    }

    // Update children
    for (let tab of this.children) {
      tab.update(tr);
    }

    // Update window title
    document.title =
      this.currentTab === null ? "text.management" : this.currentTab.state.name;
  }
}
