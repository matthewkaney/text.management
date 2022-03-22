import express from "express";
import { join } from "path";

import { getMessages } from "../osc/osc";

const app = express();

app.use(express.static(join(__dirname, "../client")));

import { networkInterfaces } from "os";

const server = app.listen(1234, () => {
  let nets = networkInterfaces();

  for (const netList of Object.values(nets)) {
    if (netList) {
      for (const net of netList) {
        if (net.family === "IPv4" && !net.internal) {
          console.log(`Editor is live: ${net.address}:1234`);
        }
      }
    }
  }
});

import { Server as WSServer } from "ws";
import { GHCI } from "./ghci";

const wss = new WSServer({ server });

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
