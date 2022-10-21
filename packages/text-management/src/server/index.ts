#!/usr/bin/env node

import program from "./cli";

import express from "express";
import { join } from "path";

import { message, getMessages } from "../osc/osc";

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

import WebSocket, { Server as WSServer } from "ws";
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

interface UserCursor {
  from: number;
  to: number;
  socket: WebSocket;
}

const cursors: { [id: string]: UserCursor } = {};

wss.on("connection", (ws) => {
  function GHCIHandler(data: Buffer) {
    ws.send(data);
  }

  ghci.on("message", GHCIHandler);

  let socketId: string;

  ws.on("message", (data) => {
    if (data instanceof Buffer) {
      for (let osc of getMessages(data)) {
        if (osc.address === "/tidal/code" && typeof osc.args[0] === "string") {
          let code = osc.args[0];
          // Verbose logging
          // console.log(`UI: "${code}"`);
          ghci.send(code);
        } else if (osc.address === "/doc/get") {
          getDocument(doc, ws);
          for (let [id, { from, to }] of Object.entries(cursors)) {
            ws.send(message("/cursor/push", id, from, to));
          }
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
        } else if (
          osc.address === "/cursor/push" &&
          typeof osc.args[0] === "string" &&
          typeof osc.args[1] === "number" &&
          typeof osc.args[2] === "number"
        ) {
          let [id, from, to] = osc.args;
          socketId = id;
          cursors[id] = { from, to, socket: ws };

          for (let [listenerId, { socket }] of Object.entries(cursors)) {
            if (listenerId !== id) {
              socket.send(message("/cursor/push", id, from, to));
            }
          }
        } else {
          console.log("Unrecognized OSC Message");
          console.log(osc);
        }
      }
    }
  });

  ws.on("close", () => {
    ghci.off("message", GHCIHandler);
  });
});
