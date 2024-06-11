import { WebMessage } from "../messageType";

type FrameResource = FrameScriptResource | FrameStyleResource;

interface FrameBaseResource {
  type: "script" | "style" | "html";
  src: string | URL;
}

interface FrameScriptResource extends FrameBaseResource {
  type: "script";
  module?: boolean;
}

interface FrameStyleResource extends FrameBaseResource {
  type: "style";
}

export class ExtensionFrame {
  dom: HTMLIFrameElement;
  port: MessagePort;

  constructor(...resources: FrameResource[]) {
    this.dom = document.createElement("iframe");
    this.dom.src = new URL("../frame/index.html", import.meta.url).href;

    const channel = new MessageChannel();
    this.port = channel.port1;

    this.dom.addEventListener("load", () => {
      if (this.dom.contentDocument === null)
        throw Error("Extension frame document didn't load correctly");

      this.loadResource({
        type: "script",
        src: new URL("../frame/main.ts", import.meta.url),
        module: true,
      }).then(() => {
        this.dom.contentWindow?.postMessage("web-engine-message-port", "*", [
          channel.port2,
        ]);

        let p = Promise.resolve();

        for (let res of resources) {
          p = p.then(() => this.loadResource(res));
        }
      });
    });
  }

  private loadResource(resource: FrameResource): Promise<void> {
    const { type, src } = resource;

    if (this.dom.contentDocument === null)
      throw Error("Extension frame document didn't load correctly");

    switch (type) {
      case "script": {
        const script = this.dom.contentDocument.createElement("script");
        script.src = src instanceof URL ? src.href : src;

        if (resource.module) {
          script.type = "module";
        }

        const { promise, resolve } = Promise.withResolvers<void>();

        script.addEventListener("load", () => {
          resolve();
        });

        this.dom.contentDocument.head.appendChild(script);

        return promise;
      }

      default:
        throw Error("Unrecognized resource type");
    }
  }

  evaluate(code: string) {
    console.log("send evaluation message");
    this.port.postMessage({ type: WebMessage.Code, code });
  }
}
