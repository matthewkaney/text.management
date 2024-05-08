import { WebContents } from "electron";

import { ToMainChannels, ToRendererChannels, Handler } from "../ipc";

export function wrapIPC(webContents: WebContents) {
  function send<K extends keyof ToRendererChannels>(
    channel: K,
    value: ToRendererChannels[K]
  ) {
    webContents.send(channel, value);
  }

  function listen<K extends keyof ToMainChannels>(
    channel: K,
    handler: Handler<ToMainChannels[K]>
  ) {
    function handle(_: any, value: ToMainChannels[K]) {
      handler(value);
    }

    webContents.ipc.on(channel, handle);

    return () => {
      webContents.ipc.off(channel, handle);
    };
  }

  return [send, listen] as const;
}
