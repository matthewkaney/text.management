import { EditorView, showPanel, Panel } from "@codemirror/view";
import { ElectronAPI } from "@core/api";

import "./style.css";

export function toolbar(api: typeof ElectronAPI, version?: string) {
  function toolbarConstructor(view: EditorView): Panel {
    let consoleNode = document.createElement("div");
    consoleNode.classList.add("cm-toolbar");

    // Status indicators for future use: ◯◉✕
    let tidalInfo = new ToolbarMenu(`Tidal (${version ?? "Disconnected"})`, [
      {
        label: "Restart Tidal",
        action: () => {
          api.restart();
        },
      },
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
  private menu: HTMLElement;
  private menuItems: HTMLButtonElement[];

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
    this.dom.classList.add("cm-menu");
    this.dom.style.position = "relative";

    this.trigger = this.dom.appendChild(document.createElement("button"));
    this.trigger.classList.add("cm-menu-trigger");
    this._label = label;
    this.trigger.innerText = this._label;
    this.trigger.style.userSelect = "none";
    this.trigger.tabIndex = 0;

    this.trigger.addEventListener("click", () => {
      this.active = !this.active;
    });

    this.dom.addEventListener("keydown", ({ code }) => {
      if (this.active) {
        if (code === "ArrowDown") {
          this.focusedChild =
            (1 + (this.focusedChild ?? -1)) % this.menuItems.length;
        }

        if (code === "ArrowUp") {
          this.focusedChild =
            ((this.focusedChild ?? this.menuItems.length) +
              this.menuItems.length -
              1) %
            this.menuItems.length;
        }

        if (code === "Escape") {
          this.active = false;
          this.trigger.focus();
        }
      } else {
        if (code === "Escape") {
          this.trigger.blur();
        }
      }
    });

    this.dom.addEventListener("focusout", ({ relatedTarget }) => {
      if (relatedTarget instanceof Node && this.dom.contains(relatedTarget))
        return;

      // this.active = false;
    });

    this.menu = this.dom.appendChild(document.createElement("div"));
    this.menu.classList.add("cm-menu-item-list");

    this.menuItems = [];

    let itemGroup = this.menu.appendChild(document.createElement("div"));
    itemGroup.classList.add("cm-menu-item-group");

    for (let { label, action } of items) {
      let itemButton = itemGroup.appendChild(document.createElement("button"));
      itemButton.classList.add("cm-menu-item");
      itemButton.innerText = label;
      itemButton.addEventListener("click", () => {
        this.active = false;
        action();
      });
      itemButton.tabIndex = -1;
      this.menuItems.push(itemButton);
    }
  }

  private _active = false;

  get active() {
    return this._active;
  }

  set active(value) {
    if (this.active === value) return;

    this.dom.classList.toggle("cm-active-menu", value);

    if (value) {
      this.menu.style.bottom =
        this.trigger.getBoundingClientRect().height + "px";
    }

    this._active = value;
  }

  private _focusedChild: number | null = null;

  get focusedChild() {
    return this._focusedChild;
  }

  set focusedChild(value) {
    if (typeof value === "number") {
      this.menuItems[value].focus();
    }

    this._focusedChild = value;
  }
}
