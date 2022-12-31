#!/usr/bin/env node

import program from "./cli";

import express from "express";
import { join } from "path";

const app = express();

app.get("/:sessionID?", (req, res) => {
  res.sendFile(join(__dirname, "../../dist/client/index.html"));
});
app.use("/static", express.static(join(__dirname, "../../dist/client")));

import { networkInterfaces } from "os";

app.listen(1234, () => {
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

import { GHCI } from "../../../languages/tidal/ghci";
import { Document } from "../document";

const doc = Document.create(program.args[0]);
const ghci = new GHCI();

import { startReplClient } from "./database";

if (program.opts().remote) {
  let id = program.opts().remote;
  id = typeof id === "string" ? id : undefined;

  doc.then((d) => startReplClient(id, d, ghci));
} else {
  console.log("Please use the -r flag to connect to a remote session");
}
