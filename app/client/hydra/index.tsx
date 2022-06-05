import { useState, useEffect } from "react";

import pageSource from "bundle-text:../../languages/hydra/viewer.html";

interface HydraCanvasProps {
  channel: MessageChannel;
}

export function HydraCanvas({ channel }: HydraCanvasProps) {
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (iframe) {
      let onLoad = () => {
        console.log("sent channel");
        iframe.contentWindow?.postMessage("channel", "*", [channel.port2]);
      };

      iframe.addEventListener("load", onLoad);

      return () => {
        iframe.removeEventListener("load", onLoad);
      };
    }
  }, [iframe, channel]);

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
