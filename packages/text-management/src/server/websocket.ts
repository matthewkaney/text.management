// Old OSC/Websocket-based collaboration protocol

const wss = new WSServer({ server });

wss.on("connection", (ws) => {
  function GHCIHandler(data: Buffer) {
    ws.send(data);
  }

  ghci.on("message", GHCIHandler);

  ws.on("message", (data) => {
    if (data instanceof Buffer) {
      for (let osc of getMessages(data)) {
        //console.log(`Received: ${osc.address}, ${JSON.stringify(osc.args)}`);
        if (osc.address === "/tidal/code" && typeof osc.args[0] === "string") {
          let code = osc.args[0];
          // Verbose logging
          // console.log(`UI: "${code}"`);
          ghci.send(code);
        } else if (osc.address === "/doc/get") {
          getDocument(doc, ws);
        } else if (
          osc.address === "/doc/pull" &&
          typeof osc.args[0] === "number"
        ) {
          pullUpdates(ws, osc.args[0]);
        } else if (
          osc.address === "/doc/push" &&
          typeof osc.args[0] === "number"
        ) {
          let updates = osc.args.slice(1);
          if (updates.every((u) => typeof u === "string")) {
            pushUpdates(doc, ws, osc.args[0], ...(updates as string[]));
          }
        }
      }
    }
  });

  ws.on("close", () => {
    ghci.off("message", GHCIHandler);
  });
});

export async function getDocument(doc: Document, ws: WebSocket) {
  // Version, Document Contents
  ws.send(message("/doc", updates.length, (await doc.contents).toString()));
}

export function pullUpdates(ws: WebSocket, version: number) {
  if (version < updates.length) {
    ws.send(
      message(
        "/doc/pull/done",
        ...updates.slice(version).map((u) => JSON.stringify(u))
      )
    );
  } else {
    pending.push((newUpdates: string[]) => {
      ws.send(message("/doc/pull/done", ...newUpdates));
    });
  }
}

export function pushUpdates(
  doc: Document,
  ws: WebSocket,
  version: number,
  ...newUpdates: string[]
) {
  if (version !== updates.length) {
    // respond with false
    ws.send(message("/doc/push/done", false));
  } else {
    for (let update of newUpdates.map((u) => JSON.parse(u))) {
      let changes = ChangeSet.fromJSON(update.changes);
      updates.push({ changes, clientID: update.clientID });
      doc.update(changes);
    }
    ws.send(message("/doc/push/done", true));
    // Notify pending requests
    while (pending.length) pending.pop()!(newUpdates);
  }
}
