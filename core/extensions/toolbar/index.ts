import { EditorView, showPanel, Panel } from "@codemirror/view";
import { ElectronAPI } from "@core/api";

export function toolbar(api: typeof ElectronAPI, version?: string) {
  function toolbarConstructor(view: EditorView): Panel {
    let consoleNode = document.createElement("div");
    consoleNode.classList.add("cm-toolbar");

    let tidalInfo = consoleNode.appendChild(document.createElement("div"));
    tidalInfo.innerText = `Tidal (${version ?? "Disconnected"})`;

    let offTidalVersion = api.onTidalVersion((version) => {
      tidalInfo.innerText = `Tidal (${version})`;
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
