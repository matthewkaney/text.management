import { showPanel, Panel } from "@codemirror/view";

import { ElectronAPI } from "@core/api";
import { Config } from "@core/state";

import { getTimer } from "./timer";

import "./style.css";

export function toolbarConstructor(
  api: typeof ElectronAPI,
  configuration: Config,
  version?: string
): Panel {
  let toolbarNode = document.createElement("div");
  toolbarNode.classList.add("cm-toolbar");
  toolbarNode.setAttribute("role", "menubar");
  toolbarNode.setAttribute("aria-label", "Editor Controls");

  let toolbarLeft = toolbarNode.appendChild(document.createElement("div"));
  toolbarLeft.classList.add("cm-toolbar-region");

  let toolbarRight = toolbarNode.appendChild(document.createElement("div"));
  toolbarRight.classList.add("cm-toolbar-region");

  let timer = getTimer(configuration);
  toolbarLeft.appendChild(timer.dom);

  // Status indicators for future use: ◯◉✕
  let tidalInfo = new ToolbarMenu(
    `Tidal (${version ?? "Disconnected"})`,
    [
      {
        label: "Restart Tidal",
        action: () => {
          api.restart();
        },
      },
      {
        label: "Tidal Settings",
        action: () => {
          api.openTidalSettings();
        },
      },
    ],
    "status"
  );
  toolbarRight.appendChild(tidalInfo.dom);

  let offTidalVersion = api.onTidalVersion((version) => {
    tidalInfo.label = `Tidal (${version})`;
  });

  // Tempo info
  let tempoInfo = new ToolbarMenu(`◯ 0`, [], "timer");
  toolbarRight.appendChild(tempoInfo.dom);

  let offTidalNow = api.onTidalNow((cycle) => {
    cycle = Math.max(0, cycle);
    let whole = Math.floor(cycle);
    let part = "◓◑◒◐"[Math.floor(cycle * 4) % 4];

    let mods = [4, 8, 16];
    let modString = mods.map((mod) => `${whole % mod}/${mod}`).join(" ");

    tempoInfo.label = `${part} ${whole} ${modString}`;
  });

  return {
    dom: toolbarNode,
    destroy() {
      offTidalVersion();
      offTidalNow();
    },
  };
}

export function toolbarExtension(
  api: typeof ElectronAPI,
  configuration: Config,
  version?: string
) {
  return showPanel.of(() => toolbarConstructor(api, configuration, version));
}

interface MenuItem {
  label: string;
  action: () => void;
}

export class ToolbarMenu {
  readonly dom: HTMLElement;

  private trigger: HTMLElement;
  // private menu: HTMLElement;
  // private menuItems: HTMLButtonElement[];

  private _label: string;

  get label() {
    return this._label;
  }

  set label(value: string) {
    this._label = value;
    this.trigger.innerText = this._label;
  }

  constructor(label: string, items: MenuItem[], role?: string) {
    this.dom = document.createElement("div");
    this.dom.classList.add("cm-menu");
    // this.dom.setAttribute("role", "none");

    this.trigger = this.dom.appendChild(document.createElement("div"));
    this.trigger.classList.add("cm-menu-trigger");
    if (role) this.trigger.setAttribute("role", role);
    // this.trigger.ariaHasPopup = "true";
    // this.trigger.ariaExpanded = "false";
    this.trigger.id = label.replace(/\W+/g, "-");
    this._label = label;
    this.trigger.innerText = this._label;
    // this.trigger.tabIndex = 0;

    // this.trigger.addEventListener("click", () => {
    //   this.active = !this.active;
    // });

    // this.dom.addEventListener("keydown", ({ code }) => {
    //   if (this.active) {
    //     if (code === "ArrowDown") {
    //       this.focusedChild =
    //         (1 + (this.focusedChild ?? -1)) % this.menuItems.length;
    //     }

    //     if (code === "ArrowUp") {
    //       this.focusedChild =
    //         ((this.focusedChild ?? this.menuItems.length) +
    //           this.menuItems.length -
    //           1) %
    //         this.menuItems.length;
    //     }

    //     if (code === "Escape") {
    //       this.active = false;
    //       this.trigger.focus();
    //     }
    //   } else {
    //     if (code === "Escape") {
    //       this.trigger.blur();
    //     }
    //   }
    // });

    // this.dom.addEventListener("focusout", ({ relatedTarget }) => {
    //   if (relatedTarget instanceof Node && this.dom.contains(relatedTarget))
    //     return;

    //   this.active = false;
    // });

    //   this.menu = this.dom.appendChild(document.createElement("div"));
    //   this.menu.classList.add("cm-menu-item-list");
    //   this.menu.setAttribute("role", "menu");
    //   this.menu.setAttribute("aria-labelledby", this.trigger.id);

    //   this.menuItems = [];

    //   let itemGroup = this.menu.appendChild(document.createElement("div"));
    //   itemGroup.classList.add("cm-menu-item-group");

    //   for (let { label, action } of items) {
    //     let itemButton = itemGroup.appendChild(document.createElement("button"));
    //     itemButton.classList.add("cm-menu-item");
    //     itemButton.innerText = label;
    //     itemButton.setAttribute("role", "menuitem");
    //     itemButton.addEventListener("click", () => {
    //       this.active = false;
    //       action();
    //     });
    //     itemButton.tabIndex = -1;
    //     this.menuItems.push(itemButton);
    //   }
  }

  // private _active = false;

  // get active() {
  //   return this._active;
  // }

  // set active(value) {
  //   if (this.active === value) return;

  //   this.dom.classList.toggle("cm-active-menu", value);

  //   this.trigger.ariaExpanded = value.toString();

  //   if (value) {
  //     this.menu.style.bottom =
  //       this.trigger.getBoundingClientRect().height + "px";
  //     this.focusedChild = 0;
  //   }

  //   this._active = value;
  // }

  // private _focusedChild: number | null = null;

  // get focusedChild() {
  //   return this._focusedChild;
  // }

  // set focusedChild(value) {
  //   if (typeof value === "number") {
  //     this.menuItems[value].focus();
  //   }

  //   this._focusedChild = value;
  // }
}
