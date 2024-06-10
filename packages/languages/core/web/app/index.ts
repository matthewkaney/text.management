import { WebMessage } from "../messageType";

export interface ExtensionFrame {
  dom: HTMLIFrameElement;
  evaluate: (code: string) => void;
}

export function createExtensionFrame(src: string): ExtensionFrame {
  const dom = document.createElement("iframe");
  dom.src = new URL("../frame/index.html", import.meta.url).href;

  const channel = new MessageChannel();
  const port = channel.port1;

  dom.addEventListener("load", () => {
    if (dom.contentDocument === null)
      throw Error("Extension frame document didn't load correctly");

    const script = dom.contentDocument.createElement("script");
    script.src = new URL("../frame/main.ts", import.meta.url).href;

    script.addEventListener("load", () => {
      dom.contentWindow?.postMessage("web-engine-message-port", "*", [
        channel.port2,
      ]);

      port.postMessage({ type: WebMessage.LoadModule, src });
    });

    dom.contentDocument.head.appendChild(script);
  });

  return {
    dom,
    evaluate: (code) => {
      port.postMessage({ type: WebMessage.Code, code });
    },
  };
}
