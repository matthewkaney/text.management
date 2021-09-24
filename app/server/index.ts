//@ts-ignore
import { Server as FileServer } from "node-static";
import { createServer } from "http";

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
    console.log(`UI: "${message.toString()}"`);
    ghci.send(message.toString());
  });

  ws.on("close", () => {
    ghci.close();
  });
});
