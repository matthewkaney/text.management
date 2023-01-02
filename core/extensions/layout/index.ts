import { EditorView } from "@codemirror/view";
import "./style.css";

export class EditorLayout {
  _dom: HTMLDivElement = document.createElement("div");

  get dom() {
    return this._dom;
  }

  private tabRegion = new TabRegion();
  private child: EditorView | null = null;

  constructor(parent: HTMLElement) {
    this.dom.appendChild(this.tabRegion.dom);

    parent.appendChild(this.dom);
  }

  addTab(name: string, tab: EditorView) {
    if (this.child) {
      this.child.destroy();
    }

    this.child = tab;
    this.dom.appendChild(tab.dom);
    this.tabRegion.addTab(name);
  }
}

class TabRegion {
  dom: HTMLDivElement;

  private tab: Tab | null = null;

  constructor() {
    this.dom = document.createElement("div");
    this.dom.classList.add("tab-region");
  }

  addTab(name: string) {
    if (this.tab) {
      this.dom.removeChild(this.tab.dom);
      this.tab = null;
    }

    this.tab = new Tab(name, true);
    this.dom.appendChild(this.tab.dom);
  }
}

class Tab {
  dom: HTMLDivElement;

  constructor(label: string, current = false) {
    this.dom = document.createElement("div");
    this.dom.innerText = label;
    if (current) this.dom.classList.add("current");
    this.dom.classList.add("tab");
  }
}
