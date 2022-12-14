import { EditorView, showPanel, Panel } from "@codemirror/view";

function toolbarConstructor(view: EditorView): Panel {
  let consoleNode = document.createElement("div");
  consoleNode.classList.add("cm-toolbar");

  let tidalInfo = consoleNode.appendChild(document.createElement("div"));
  tidalInfo.innerText = "Tidal ()";

  return {
    dom: consoleNode,
    update(update) {},
    destroy() {},
  };
}

export const toolbar = showPanel.of(toolbarConstructor);
