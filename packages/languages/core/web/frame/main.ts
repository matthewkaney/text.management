import { WebMessage } from "../messageType";

window.addEventListener("message", ({ data, ports }) => {
  if (data === "web-engine-message-port" && ports.length > 0) {
    let [port] = ports;

    port.addEventListener("message", async ({ data }) => {
      switch (data.type) {
        case WebMessage.LoadModule:
          const extension = await import(data.src);
          break;
        case WebMessage.Code:
          try {
            eval(data.code);
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
