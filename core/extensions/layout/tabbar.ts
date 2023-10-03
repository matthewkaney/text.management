import { LayoutTransaction, TabState } from "./state";
import { LayoutView, TabView } from "./view";

import { icon } from "@fortawesome/fontawesome-svg-core";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export class TabBar {
  readonly dom: HTMLDivElement;

  private children: Map<string, TabButton> = new Map();

  constructor(private parent: LayoutView) {
    this.dom = document.createElement("div");
    this.dom.classList.add("tab-bar");
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
  readonly dom: HTMLDivElement;

  private state: TabState<any>;

  private tabButton: HTMLButtonElement;
  private closeButton: HTMLButtonElement;

  constructor(private parent: LayoutView, private view: TabView<any>) {
    this.state = this.view.state;

    this.dom = document.createElement("div");
    this.dom.classList.add("tab-container");

    this.tabButton = this.dom.appendChild(document.createElement("button"));
    this.tabButton.innerText = this.state.name;
    this.tabButton.classList.add("tab");
    this.tabButton.setAttribute("role", "tab");
    this.tabButton.setAttribute("aria-controls", this.state.id);
    this.tabButton.addEventListener("mousedown", () => {
      this.parent.dispatch({ current: this.state.id });
    });

    this.closeButton = this.dom.appendChild(document.createElement("button"));
    this.closeButton.classList.add("close-button");
    this.closeButton.setAttribute("aria-label", "Close");
    this.closeButton.setAttribute("aria-controls", this.state.id);
    this.closeButton.append(
      ...icon(faXmark, { attributes: { "aria-hidden": "true" } }).node
    );
    this.closeButton.addEventListener("click", (event) => {
      if (this.view.beforeClose()) {
        this.parent.dispatch({ changes: [this.state.id] });
      }
    });
  }

  update(tr: LayoutTransaction) {
    this.state = tr.state.tabs[this.state.id];

    let selected = tr.state.current === this.state.id;
    this.dom.classList.toggle("current", selected);
    this.tabButton.setAttribute("aria-selected", selected.toString());
    this.tabButton.tabIndex = selected ? 0 : -1;
    this.tabButton.innerText = this.state.name;
    this.closeButton.tabIndex = selected ? 0 : -1;
  }
}
