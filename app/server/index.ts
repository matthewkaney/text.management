//@ts-ignore
import { Server as FileServer } from "node-static";
import { createServer } from "http";

import { parse } from "../osc/osc";

const fileServer = new FileServer("./dist/client");

createServer(function (request, response) {
  request
    .addListener("end", () => {
      fileServer.serve(request, response);
    })
    .resume();
}).listen(1234);

import { Server as WebSocketServer } from "ws";
import { GHCI } from "./ghci";

const wss = new WebSocketServer({ port: 4567 });

wss.on("connection", (ws) => {
  const ghci = new GHCI((data) => {
    ws.send(data);
  });

  ws.on("message", (message) => {
    if (message instanceof Buffer) {
      let osc = parse(message);
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
  });

  ws.on("close", () => {
    ghci.close();
  });
});
