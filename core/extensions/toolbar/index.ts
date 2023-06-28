import { EditorView, showPanel, Panel } from "@codemirror/view";
import { ElectronAPI } from "@core/api";

import "./style.css";

export function toolbar(api: typeof ElectronAPI, version?: string) {
  function toolbarConstructor(view: EditorView): Panel {
    let consoleNode = document.createElement("div");
    consoleNode.classList.add("cm-toolbar");

    let tidalInfo = new ToolbarMenu(`Tidal (${version ?? "Disconnected"})`, [
      { label: "Restart Tidal", action: () => {} },
      { label: "Boot Files", action: () => {} },
    ]);
    consoleNode.appendChild(tidalInfo.dom);

    let offTidalVersion = api.onTidalVersion((version) => {
      tidalInfo.label = `Tidal (${version})`;
    });

    return {
      dom: consoleNode,
      destroy() {
        offTidalVersion();
      },
    };
  }

  return showPanel.of(toolbarConstructor);
}

interface MenuItem {
  label: string;
  action: () => void;
}

class ToolbarMenu {
  readonly dom: HTMLElement;
  private trigger: HTMLElement;

  private _label: string;

  get label() {
    return this._label;
  }

  set label(value: string) {
    this._label = value;
    this.trigger.innerText = this._label;
  }

  constructor(label: string, items: MenuItem[]) {
    this.dom = document.createElement("div");
    this.dom.style.position = "relative";

    this.trigger = this.dom.appendChild(document.createElement("button"));
    this.trigger.classList.add("cm-menu-trigger");
    this._label = label;
    this.trigger.innerText = this._label;
    this.trigger.style.userSelect = "none";
    this.trigger.tabIndex = 0;

    this.trigger.addEventListener("click", () => {
      this.trigger.classList.toggle("cm-menu-active");
      if (itemsNode.style.display === "none") {
        itemsNode.style.bottom =
          this.trigger.getBoundingClientRect().height + "px";
        itemsNode.style.right = "0";
        itemsNode.style.display = "initial";
      } else {
        itemsNode.style.display = "none";
      }
    });

    let itemsNode = this.dom.appendChild(document.createElement("div"));
    itemsNode.style.position = "absolute";
    itemsNode.style.display = "none";

    for (let item of items) {
      let itemNode = itemsNode.appendChild(document.createElement("div"));
      let itemButton = itemNode.appendChild(document.createElement("button"));
      itemButton.classList.add("cm-menu-item");
      itemButton.innerText = item.label;
    }
  }
}
