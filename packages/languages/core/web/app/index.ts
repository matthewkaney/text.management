import { WebMessage } from "../messageType";

interface FrameResource {
  type: "script";
  src: string | URL;
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

  private loadResource({ type, src }: FrameResource): Promise<void> {
    if (this.dom.contentDocument === null)
      throw Error("Extension frame document didn't load correctly");

    switch (type) {
      case "script": {
        const script = this.dom.contentDocument.createElement("script");
        script.src = src instanceof URL ? src.href : src;

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
}
