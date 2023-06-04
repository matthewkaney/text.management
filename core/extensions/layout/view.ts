import { EditorView } from "@codemirror/view";

import { LayoutTransactionSpec, LayoutTransaction } from "./state";

import { library, icon } from "@fortawesome/fontawesome-svg-core";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

library.add(faXmark);

import "./style.css";

export class LayoutView {
  readonly dom: HTMLDivElement;
  private tabRegion: HTMLDivElement;

  // TODO: The relevant info here should be moved to state
  public children: TabView[] = [];
  public current: number | null = null;

  private currentEditor: EditorView | null = null;

  constructor(parent: HTMLElement) {
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
        changes || [],
        current || 0,
        effects || []
      )
    );
  }

  update(tr: LayoutTransaction) {
    this.current = tr.newCurrent;

    // Update self
    let index = 0;
    for (let change of tr.changes) {
      if (typeof change === "number") {
        index += change;
      } else if (change === null) {
        let [tab] = this.children.splice(index, 1);
        this.tabRegion.removeChild(tab.tab);
      } else {
        let { name, doc, extensions } = change;
        let editor = new EditorView({ doc: doc, extensions });
        let tab = new TabView(index, name, editor, this);
        this.tabRegion.insertBefore(
          tab.tab,
          index < this.children.length ? this.children[index].tab : null
        );
        this.children.splice(index, 0, tab);
        index += 1;
      }
    }

    // Update current editor
    if (this.currentEditor) {
      this.dom.removeChild(this.currentEditor.dom);
      this.currentEditor = null;
    }

    if (tr.newCurrent !== null) {
      console.log(tr.newCurrent);
      this.currentEditor = this.children[tr.newCurrent].editor;
      this.dom.appendChild(this.currentEditor.dom);
    }

    // Update children
    for (let tab of this.children) {
      tab.update(tr);
    }
  }
}

class TabView {
  public tab: HTMLDivElement;

  constructor(
    private index: number,
    public label: string,
    public editor: EditorView,
    private layout: LayoutView
  ) {
    this.tab = document.createElement("div");
    this.tab.innerText = label;
    this.tab.classList.add("tab");
    this.tab.addEventListener("click", () => {
      if (this.index !== null) {
        this.layout.dispatch({ current: this.index });
      }
    });

    let closeButton = this.tab.appendChild(document.createElement("a"));
    closeButton.classList.add("close-button");
    Array.from(icon({ prefix: "fas", iconName: "xmark" }).node).map((n) => {
      closeButton.appendChild(n);
    });
    closeButton.addEventListener("click", (event) => {
      let newCurrent: number | null | undefined = undefined;
      if (this.layout.current !== null && this.layout.current >= this.index) {
        newCurrent =
          this.layout.children.length > 1
            ? Math.max(this.layout.current - 1, 0)
            : null;
      } else {
        newCurrent = this.layout.current;
      }
      this.layout.dispatch({ current: newCurrent, changes: [index, null] });
      event.stopPropagation();
    });
  }

  update(tr: LayoutTransaction) {
    let index = 0;

    if (this.index !== null) {
      for (let change of tr.changes) {
        if (typeof change === "number") {
          index += change;
        } else if (change === null) {
          if (index === this.index) {
            this.index === -1;
            break;
          } else if (index < this.index) {
            this.index -= 1;
          }
        } else {
          if (index < this.index) {
            index += 1;
            this.index += 1;
          }
        }

        if (index >= this.index) {
          break;
        }
      }
    }

    this.tab.classList.toggle("current", tr.newCurrent === this.index);
  }
}
