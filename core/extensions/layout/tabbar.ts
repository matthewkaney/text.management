import { LayoutTransaction, TabState } from "./state";
import { LayoutView, TabView } from "./view";

import { library, icon } from "@fortawesome/fontawesome-svg-core";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

library.add(faXmark);

export class TabBar {
  readonly dom: HTMLDivElement;

  // private focused: string | null = null;

  private children: Map<string, TabButton> = new Map();

  constructor(private parent: LayoutView) {
    this.dom = document.createElement("div");
    this.dom.classList.add("tab-region");
    this.dom.setAttribute("role", "tablist");

    this.dom.addEventListener("keydown", (event) => {
      if (event.code === "ArrowRight" || event.code === "ArrowLeft") {
        let { current, order } = this.parent.state;

        if (current === null)
          throw Error("Tab bar is focused but there's aren't any open tabs");

        let currentIndex = order.indexOf(current);

        if (currentIndex === -1)
          throw Error("Current tab isn't contained within state");

        if (event.code === "ArrowRight") {
          currentIndex = (currentIndex + 1) % order.length;
        } else if (event.code === "ArrowLeft") {
          currentIndex = (currentIndex + order.length - 1) % order.length;
        }

        // Set current
        current = order[currentIndex];
        this.parent.dispatch({ current });

        // But keep focus on tabs
        let currentButton = this.children.get(current);

        if (currentButton === undefined)
          throw Error("Tried to change focus to a non-existent tab");

        currentButton.dom.focus();
      }
    });
  }

  update(tr: LayoutTransaction) {
    for (let change of tr.changes.changelist) {
      if (typeof change === "string") {
        let deletedTab = this.children.get(change);
        if (deletedTab) {
          this.dom.removeChild(deletedTab.dom);
          this.children.delete(change);
        }
      } else if (Array.isArray(change)) {
        // TODO: Support tab movements
      } else {
        let { state } = change.view;
        let tab = new TabButton(this.parent, change.view);
        this.children.set(state.id, tab);
        // TODO: This assumes that all added tabs are added to the end
        this.dom.appendChild(tab.dom);
      }
    }

    // Update tab buttons
    for (let [_, child] of this.children) {
      child.update(tr);
    }
  }
}

class TabButton {
  // TODO: This should be a button probably
  readonly dom: HTMLDivElement;

  private state: TabState<any>;

  private label: HTMLSpanElement;
  private closeButton: HTMLAnchorElement;

  constructor(private parent: LayoutView, private view: TabView<any>) {
    this.state = this.view.state;

    this.dom = document.createElement("div");
    this.dom.classList.add("tab");
    this.dom.setAttribute("role", "tab");
    this.dom.setAttribute("aria-controls", this.state.id);
    this.dom.addEventListener("click", () => {
      this.parent.dispatch({ current: this.state.id });
    });

    this.label = document.createElement("span");
    this.label.innerText = this.state.name;
    this.dom.appendChild(this.label);

    this.closeButton = this.dom.appendChild(document.createElement("a"));
    this.closeButton.classList.add("close-button");
    this.closeButton.setAttribute("aria-label", "Close");
    Array.from(icon({ prefix: "fas", iconName: "xmark" }).node).map((n) => {
      this.closeButton.appendChild(n);
    });
    this.closeButton.addEventListener("click", (event) => {
      if (this.view.beforeClose()) {
        this.parent.dispatch({ changes: [this.state.id] });
      }
      event.stopPropagation();
    });
  }

  update(tr: LayoutTransaction) {
    this.state = tr.state.tabs[this.state.id];

    let selected = tr.state.current === this.state.id;
    this.dom.classList.toggle("current", selected);
    this.dom.setAttribute("aria-selected", selected.toString());
    this.dom.tabIndex = selected ? 0 : -1;
    this.closeButton.tabIndex = selected ? 0 : -1;
    this.label.innerText = this.state.name;
  }
}
