import { EditorView } from "@codemirror/view";

import {
  LayoutTransactionSpec,
  LayoutTransaction,
  changeNameEffect,
} from "./state";

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
      if (typeof change === "number") {
        let [tab] = this.children.splice(change, 1);
        tab.destroy();
        this.tabRegion.removeChild(tab.tab);
      } else if (Array.isArray(change)) {
        // TODO: Support tab movements
      } else {
        let { id, name, doc, extensions, fileID } = change;
        let index = id ?? this.children.length;
        let editor = new EditorView({ doc: doc, extensions });
        let tab = new TabView(index, name, editor, this, fileID);
        this.tabRegion.insertBefore(tab.tab, this.children[index]?.tab);
        this.children.splice(index, 0, tab);
      }
    }

    // Update current editor
    if (currentChanged) {
      this.updateCurrent(
        this.current !== null ? this.children[this.current].fileID : null
      );
      if (this.currentEditor && this.dom.contains(this.currentEditor.dom)) {
        this.dom.removeChild(this.currentEditor.dom);
        this.currentEditor = null;
      }

      if (tr.newCurrent !== null) {
        this.currentEditor = this.children[tr.newCurrent].editor;
        this.dom.appendChild(this.currentEditor.dom);
        this.currentEditor.focus();
      }
    }

    // Update children
    for (let tab of this.children) {
      tab.update(tr);
    }

    // Update window title
    document.title =
      this.current === null
        ? "text.management"
        : this.children[this.current].label;
  }
}

class TabView {
  public tab: HTMLDivElement;

  constructor(
    private index: number,
    public label: string,
    public editor: EditorView,
    private layout: LayoutView,
    public fileID: string | null
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
      this.layout.dispatch({ changes: [this.index] });
      event.stopPropagation();
    });
  }

  update(tr: LayoutTransaction) {
    let index = tr.changes.mapIndex(this.index);

    if (index === null) {
      throw Error("Trying to update a destroyed tab");
    }

    this.index = index;

    this.tab.classList.toggle("current", tr.newCurrent === this.index);

    for (let effect of tr.effects) {
      if (effect.is(changeNameEffect) && effect.value.id === this.index) {
        this.label = effect.value.name;
        this.tab.innerText = this.label;
      }
    }
  }

  destroy() {
    this.editor.destroy();
  }
}
