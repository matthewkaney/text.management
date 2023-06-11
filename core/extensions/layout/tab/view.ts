import { EditorState, EditorStateConfig } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { LayoutView } from "../view";

import { TabState } from "./state";

import { LayoutTransaction, changeNameEffect } from "../state";

import { library, icon } from "@fortawesome/fontawesome-svg-core";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

library.add(faXmark);

// export class TabView<T> {
//   public tab: HTMLDivElement;

//   private tabSpec: TabSpec;
//   public dom: HTMLElement;

//   constructor(
//     private index: number,
//     private layout: LayoutView,
//     public fileID: string | null,
//     public state: TabState<T>
//   ) {
//     this.tab = document.createElement("div");
//     this.tab.innerText = state.name;
//     this.tab.classList.add("tab");
//     this.tab.addEventListener("click", () => {
//       if (this.index !== null) {
//         this.layout.dispatch({ current: this.index });
//       }
//     });

//     let closeButton = this.tab.appendChild(document.createElement("a"));
//     closeButton.classList.add("close-button");
//     Array.from(icon({ prefix: "fas", iconName: "xmark" }).node).map((n) => {
//       closeButton.appendChild(n);
//     });
//     closeButton.addEventListener("click", (event) => {
//       this.layout.dispatch({ changes: [this.index] });
//       event.stopPropagation();
//     });

//     // Create dom element
//     this.dom = document.createElement("div");

//     this.tabSpec = state.type.create(this);
//     this.dom.appendChild(this.tabSpec.dom);
//   }

//   update(tr: LayoutTransaction) {
//     let index = tr.changes.mapIndex(this.index);

//     if (index === null) {
//       throw Error("Trying to update a destroyed tab");
//     }

//     this.index = index;

//     this.tab.classList.toggle("current", tr.newCurrent === this.index);

//     for (let effect of tr.effects) {
//       if (effect.is(changeNameEffect) && effect.value.id === this.index) {
//         this.tab.innerText = this.state.name;
//       }
//     }
//   }

//   destroy() {
//     if (this.tabSpec.destroy) this.tabSpec.destroy();
//   }
// }

abstract class TabView<T> {
  abstract readonly dom: HTMLElement;

  constructor() {}
}

export class EditorTabView extends TabView<EditorState> {
  readonly dom = document.createElement("div");

  private editor;

  constructor(config?: EditorStateConfig) {
    super();

    // Set up dom...

    this.editor = new EditorView({
      state: EditorState.create(config),
      parent: this.dom,
    });
  }

  destroy() {
    this.editor.destroy();
  }
}
