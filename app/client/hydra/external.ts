import { evalHandler } from "../../codemirror/evaluate/evaluation";
import { keymap } from "@codemirror/view";
import { message } from "../../osc/osc";

let childViewer: null | Window = null;
let childChannel: null | MessageChannel = null;

export function externalViewer() {
  return [
    evalHandler((code) => {
      childChannel?.port1.postMessage(message("/code", code));
    }),
    keymap.of([
      {
        key: "Mod-i",
        run: () => {
          if (!childViewer) {
            if ((childViewer = window.open("./hydra"))) {
              childChannel = new MessageChannel();
              childViewer.addEventListener("load", () => {
                if (childViewer && childChannel) {
                  childViewer.postMessage("channel", "*", [childChannel.port2]);
                }
              });
            }
          }
          return true;
        },
      },
    ]),
  ];
}
