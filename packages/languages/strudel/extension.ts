import { createExtensionFrame } from "../core/web/app";

export function getStrudelFrame() {
  return createExtensionFrame(new URL("strudel.js", import.meta.url).href);
}
