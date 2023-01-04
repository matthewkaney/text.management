import { EditorView } from "@codemirror/view";
import "./style.css";

export class EditorLayout {
  _dom: HTMLDivElement = document.createElement("div");

  get dom() {
    return this._dom;
  }

  private tabRegion = new TabRegion();
  private children: EditorView[] = [];
  private current: number | null = null;

  constructor(parent: HTMLElement) {
    this.dom.classList.add("editor-layout");
    this.dom.appendChild(this.tabRegion.dom);

    parent.appendChild(this.dom);
  }

  addTab(name: string, tab: EditorView) {
    if (typeof this.current === "number") {
      this.dom.removeChild(this.children[this.current].dom);
    }

    this.children.push(tab);
    this.dom.appendChild(tab.dom);
    this.current = this.children.length - 1;
    this.tabRegion.addTab(name);
  }
}

class TabRegion {
  dom: HTMLDivElement;

  private tabs: Tab[] = [];

  constructor() {
    this.dom = document.createElement("div");
    this.dom.classList.add("tab-region");
  }

  addTab(name: string) {
    if (this.tabs.length) {
      this.tabs.forEach((t) => (t.current = false));
    }

    let tab = new Tab(name, true);
    this.tabs.push(tab);
    this.dom.appendChild(tab.dom);
  }
}

class Tab {
  dom: HTMLDivElement;

  private _current = false;

  get current() {
    return this._current;
  }

  set current(value) {
    this.dom.classList.toggle("current", value);
    this._current = value;
  }

  constructor(label: string, current = false) {
    this.dom = document.createElement("div");
    this.dom.innerText = label;
    this.dom.classList.add("tab");
    this.current = current;
  }
}
