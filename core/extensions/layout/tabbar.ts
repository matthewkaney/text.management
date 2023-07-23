import { LayoutTransaction, TabState } from "./state";
import { LayoutView, TabView } from "./view";

import { library, icon } from "@fortawesome/fontawesome-svg-core";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

library.add(faXmark);

export class TabBar {
  readonly dom: HTMLDivElement;

  private children: Map<string, TabButton> = new Map();

  constructor(private parent: LayoutView) {
    this.dom = document.createElement("div");
    this.dom.classList.add("tab-region");

    this.dom.addEventListener("keydown", (event) => {
      console.log(event.code);
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
    this.dom.tabIndex = 0;
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

    this.dom.classList.toggle("current", tr.state.current === this.state.id);
    this.label.innerText = this.state.name;
  }
}
