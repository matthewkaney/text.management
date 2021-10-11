import express from "express";

import { getMessages } from "../osc/osc";

const app = express();

app.use(express.static("../client"));

app.listen(1234, () => {
  console.log("server is listening");
});

import { Server as WebSocketServer } from "ws";
import { GHCI } from "./ghci";

const wss = new WebSocketServer({ port: 4567 });

wss.on("connection", (ws) => {
  const ghci = new GHCI((data) => {
    ws.send(data);
  });

  ws.on("message", (data) => {
    if (data instanceof Buffer) {
      for (let osc of getMessages(data)) {
        if (
          "address" in osc &&
          osc.address === "/tidal/code" &&
          typeof osc.args[0] === "string"
        ) {
          let code = osc.args[0];
          console.log(`UI: "${code}"`);
          ghci.send(code);
        }
      }
    }
  });

  ws.on("close", () => {
    ghci.close();
  });
});
