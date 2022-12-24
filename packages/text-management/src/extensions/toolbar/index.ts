import { EditorView, showPanel, Panel } from "@codemirror/view";
import { TextManagementAPI } from "@core/api";

export function toolbar(api: TextManagementAPI) {
  function toolbarConstructor(view: EditorView): Panel {
    let consoleNode = document.createElement("div");
    consoleNode.classList.add("cm-toolbar");

    let tidalInfo = consoleNode.appendChild(document.createElement("div"));
    tidalInfo.innerText = "Tidal (Disconnected)";

    api.getTidalVersion().then((v) => {
      if (tidalInfo) {
        tidalInfo.innerText = `Tidal (${v})`;
      }
    });

    return {
      dom: consoleNode,
      update(update) {},
      destroy() {},
    };
  }

  return showPanel.of(toolbarConstructor);
}
