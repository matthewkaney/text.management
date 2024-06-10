import { ExtensionFrame } from "../core/web/app";

export function getStrudelFrame() {
  return new ExtensionFrame({
    type: "script",
    src: new URL("strudel.js", import.meta.url),
  });
}
