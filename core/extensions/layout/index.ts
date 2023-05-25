import { EditorView } from "@codemirror/view";
import { StateEffect } from "@codemirror/state";

import { library, icon } from "@fortawesome/fontawesome-svg-core";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

library.add(faXmark);

import "./style.css";

interface LayoutTransaction {
  effects: StateEffect<any>[];
}

const currentTabEffect = StateEffect.define<number | null>();

export class EditorLayout {
  readonly dom: HTMLDivElement;
  private tabRegion: HTMLDivElement;

  private children: Map<number, TabView> = new Map();

  private _nextID = 0;

  private get nextID() {
    return this._nextID++;
  }

  private currentEditor: EditorView | null = null;

  constructor(parent: HTMLElement) {
    this.dom = document.createElement("div");
    this.dom.classList.add("editor-layout");

    this.tabRegion = this.dom.appendChild(document.createElement("div"));
    this.tabRegion.classList.add("tab-region");

    parent.appendChild(this.dom);
  }

  addTab(name: string, editor: EditorView) {
    let tab = new TabView(this.nextID, name, editor, this);
    this.children.set(tab.id, tab);
    this.tabRegion.appendChild(tab.tab);
    this.dispatch({ effects: [currentTabEffect.of(tab.id)] });
  }

  dispatch(tr: LayoutTransaction) {
    this.update(tr);
  }

  update(tr: LayoutTransaction) {
    // Update self
    for (let effect of tr.effects) {
      if (effect.is(currentTabEffect)) {
        if (this.currentEditor) {
          this.dom.removeChild(this.currentEditor.dom);
          this.currentEditor = null;
        }

        let currentTab =
          effect.value === null ? undefined : this.children.get(effect.value);

        if (currentTab) {
          this.dom.appendChild(currentTab.editor.dom);
          this.currentEditor = currentTab.editor;
        }
      }
    }

    for (let [_, tab] of this.children) {
      tab.update(tr);
    }
  }
}

class TabView {
  public tab: HTMLDivElement;

  constructor(
    public id: number,
    public label: string,
    public editor: EditorView,
    private layout: EditorLayout
  ) {
    this.tab = document.createElement("div");
    this.tab.innerText = label;
    this.tab.classList.add("tab");
    this.tab.addEventListener("click", () => {
      this.layout.dispatch({ effects: [currentTabEffect.of(this.id)] });
    });

    let closeButton = this.tab.appendChild(document.createElement("button"));
    closeButton.classList.add("close-button");
    Array.from(icon({ prefix: "fas", iconName: "xmark" }).node).map((n) => {
      closeButton.appendChild(n);
    });
    closeButton.addEventListener("click", (event) => {
      console.log("CLOSE: ", this.id);
      event.stopPropagation();
    });
  }

  update(tr: LayoutTransaction) {
    for (let effect of tr.effects) {
      if (effect.is(currentTabEffect)) {
        this.tab.classList.toggle("current", effect.value === this.id);
      }
    }
  }
}
