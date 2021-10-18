import { useState, useEffect } from "react";

import { connectRemote } from "../osc";

import pageSource from "bundle-text:./viewer.html";

export function HydraCanvas() {
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (iframe) {
      const channel = new MessageChannel();

      let onLoad = () => {
        iframe.contentWindow?.postMessage("channel", "*", [channel.port2]);
      };

      let disconnect = connectRemote(channel.port1);

      iframe.addEventListener("load", onLoad);

      return () => {
        disconnect();
        iframe.removeEventListener("load", onLoad);
      };
    }
  }, [iframe]);

  return (
    <iframe
      ref={setIframe}
      srcDoc={pageSource}
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        zIndex: -1,
        border: "none",
      }}
    ></iframe>
  );
}
