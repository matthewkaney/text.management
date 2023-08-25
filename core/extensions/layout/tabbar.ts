import { LayoutTransaction, TabState } from "./state";
import { LayoutView, TabView } from "./view";

import { library, icon } from "@fortawesome/fontawesome-svg-core";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

library.add(faXmark);

export class TabBar {
  readonly dom: HTMLDivElement;

  private focused: string | null = null;

  private children: Map<string, TabButton> = new Map();

  constructor(private parent: LayoutView) {
    this.dom = document.createElement("div");
    this.dom.classList.add("tab-region");
    this.dom.setAttribute("role", "tablist");

    this.dom.addEventListener("focusin", () => {
      this.focused = this.parent.state.current;
    });

    this.dom.addEventListener("focusout", () => {
      this.focused = null;
    });

    this.dom.addEventListener("keydown", (event) => {
      if (event.code === "ArrowRight" || event.code === "ArrowLeft") {
        let order = this.parent.state.order;

        if (this.focused === null)
          throw Error(
            "Tab bar is focused but doesn't know what tab is focused"
          );

        let focusedIndex = order.indexOf(this.focused);

        if (focusedIndex === -1)
          throw Error("Focused tab isn't contained within state");

        if (event.code === "ArrowRight") {
          focusedIndex = (focusedIndex + 1) % order.length;
        } else if (event.code === "ArrowLeft") {
          focusedIndex = (focusedIndex + order.length - 1) % order.length;
        }

        let focused = order[focusedIndex];
        let focusedButton = this.children.get(focused);

        if (focusedButton === undefined)
          throw Error("Tried to change focus to a non-existent tab");

        this.parent.dispatch({ current: focused });

        focusedButton.dom.focus();
        this.focused = order[focusedIndex];
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

    let closeButton = this.dom.appendChild(document.createElement("a"));
    closeButton.classList.add("close-button");
    Array.from(icon({ prefix: "fas", iconName: "xmark" }).node).map((n) => {
      closeButton.appendChild(n);
    });
    closeButton.addEventListener("click", (event) => {
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
    this.label.innerText = this.state.name;
  }
}
