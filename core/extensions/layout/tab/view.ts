import { EditorState, EditorStateConfig } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { LayoutView } from "../view";

import { TabState, EditorTabState } from "./state";

import { LayoutTransaction, changeNameEffect } from "../state";

import { library, icon } from "@fortawesome/fontawesome-svg-core";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

library.add(faXmark);

export abstract class TabView<T> {
  readonly dom = document.createElement("div");
  readonly tab = document.createElement("div");

  constructor(readonly layout: LayoutView, readonly state: TabState<T>) {
    console.log("tab view created");
    this.dom.classList.add("tab-content");

    this.tab.innerText = state.name;
    this.tab.classList.add("tab");
    this.tab.addEventListener("click", () => {
      this.layout.dispatch({ current: this.state.id });
    });

    let closeButton = this.tab.appendChild(document.createElement("a"));
    closeButton.classList.add("close-button");
    Array.from(icon({ prefix: "fas", iconName: "xmark" }).node).map((n) => {
      closeButton.appendChild(n);
    });
    closeButton.addEventListener("click", (event) => {
      this.layout.dispatch({ changes: [this.state.id] });
      event.stopPropagation();
    });
  }

  update(tr: LayoutTransaction) {
    this.tab.classList.toggle("current", tr.state.current === this.state.id);
  }

  abstract destroy(): void;
}

export class EditorTabView extends TabView<EditorState> {
  private editor;

  constructor(
    layout: LayoutView,
    config?: EditorStateConfig & { fileID: string }
  ) {
    const state = EditorTabState.create(config);
    super(layout, state);

    // Set up dom...

    this.editor = new EditorView({
      state: this.state.contents,
      parent: this.dom,
    });
  }

  destroy() {
    this.editor.destroy();
  }
}
