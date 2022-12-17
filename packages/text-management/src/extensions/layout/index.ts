export class EditorLayout {
  dom: HTMLDivElement;

  constructor(parent: HTMLElement) {
    this.dom = document.createElement("div");

    this.dom.appendChild(new TabRegion().dom);

    parent.appendChild(this.dom);
  }
}

class TabRegion {
  dom: HTMLDivElement;

  constructor() {
    this.dom = document.createElement("div");
    this.dom.classList.add("tab-region");

    let tab = document.createElement("div");
    tab.innerText = "Text.Management";
    tab.classList.add("tab");

    this.dom.appendChild(tab);
  }
}
