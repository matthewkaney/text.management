import { javascript } from "@codemirror/lang-javascript";
import { keymap } from "@codemirror/view";

import { evaluate, evaluation } from "packages/codemirror/evaluate/src";

import { ExtensionFrame } from "../core/web/app";

const strudelKeymap = keymap.of([
  {
    key: "Mod-Enter",
    run: (view) => {
      view.dispatch(evaluate(view.state, 0));
      return true;
    },
  },
]);

export const frame = new ExtensionFrame({
  type: "script",
  src: new URL("strudel.js", import.meta.url),
});

export function strudel() {
  return [
    strudelKeymap,
    javascript(),
    evaluation(({ code }) => {
      console.log("EVALUATE");
      console.log(code);
      frame.evaluate(code);
    }),
  ];
}
