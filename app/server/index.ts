#!/usr/bin/env node

import program from "./cli";

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
import { GHCI } from "./ghci";

import { Document } from "./authority";
import { getDocument, pullUpdates, pushUpdates } from "./authority";

let doc = new Document(program.args[0]);

// Verbose logging
// doc.contents.then((contents) => {
//   console.log("Contents:");
//   console.log(contents);
// });

const ghci = new GHCI();

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
