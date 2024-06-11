import { EventEmitter } from "@core/events";

import { WebMessage } from "../messageType";

interface ParentFrameEvents {
  evaluation: string;
}

class ParentFrame extends EventEmitter<ParentFrameEvents> {
  constructor() {
    super();

    window.addEventListener("message", ({ data, ports }) => {
      if (data === "web-engine-message-port" && ports.length > 0) {
        let [port] = ports;

        port.addEventListener("message", async ({ data }) => {
          switch (data.type) {
            case WebMessage.LoadModule:
              await import(data.src);
              break;
            case WebMessage.Code:
              console.log("evaluate message");
              try {
                this.emit("evaluation", data.code);
              } catch (error) {
                // TODO: Send this back to the editor
                throw error;
              }
              break;
          }
        });

        port.addEventListener("messageerror", (event) => {
          console.error(event);
        });

        port.start();
      }
    });
  }
}

// @ts-ignore
window.parentFrame = new ParentFrame();
