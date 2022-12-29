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

    this.dom.appendChild(new Tab("untitled.tidal").dom);
  }
}

class Tab {
  dom: HTMLDivElement;

  constructor(label: string) {
    this.dom = document.createElement("div");
    this.dom.innerText = label;
    this.dom.classList.add("tab");
  }
}
