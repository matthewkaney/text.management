import { program } from "./cli";

let { defaultBoot, boot = [] } = program.opts();

import express from "express";
import { join } from "path";

import { getMessages } from "../osc/osc";

const app = express();

app.use(express.static(join(__dirname, "../../dist/client")));

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

app.use(
  "/hydra",
  express.static(
    join(__dirname, "../../packages/languages/hydra/dist/index.html")
  )
);

app.use(
  "/three",
  express.static(
    join(__dirname, "../../packages/languages/three/dist/index.html")
  )
);

import { getDocument, pullUpdates, pushUpdates } from "./authority";

import { GHCI } from "../../packages/languages/tidal/ghci";

const ghci = new GHCI({ defaultBoot, customBootfiles: boot });

const wss = new WSServer({ server });

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    if (data instanceof Buffer) {
      for (let osc of getMessages(data)) {
        console.log(`Received: ${osc.address}, ${JSON.stringify(osc.args)}`);
        if (osc.address === "/tidal/code" && typeof osc.args[0] === "string") {
          let code = osc.args[0];
          console.log(`UI: "${code}"`);
        } else if (osc.address === "/doc/get") {
          getDocument(ws);
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
            pushUpdates(ws, osc.args[0], ...(updates as string[]));
          }
        }
      }
    }
  });

  ws.on("close", () => {
    //ghci.off("message", GHCIHandler);
  });
});
