import { createSocket } from "dgram";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { createInterface } from "readline";

import { message } from "../osc/osc";

import bootCode from "bundle-text:./BootTidal.hs";

export class GHCI {
  private socket;
  private process?: ChildProcessWithoutNullStreams;

  constructor(callback: (data: Buffer) => any) {
    this.socket = createSocket("udp4");
    this.socket.bind(0, "localhost", () => {
      this.process = spawn("ghci", ["-XOverloadedStrings"], {
        env: {
          ...process.env,
          midi_port: this.socket.address().port.toString(),
        },
      });

      this.process.stdin.write(':set prompt ""\n:set prompt-cont ""\n');

      const out = createInterface({ input: this.process.stdout });
      const err = createInterface({ input: this.process.stderr });

      this.process.stdin.write(bootCode);

      out.on("line", (data) => {
        if (!data.endsWith("> ")) {
          console.log(`GHCI: "${data}"`);
          callback(Buffer.from(message("/tidal/reply", data)));
        }
      });

      err.on("line", (data) => {
        if (data !== "") {
          console.error(`Error: ${data}`);
          callback(Buffer.from(message("/tidal/error", data)));
        }
      });

      this.process.on("close", (code) => {
        console.log(`child process exited with code ${code}`);
      });
    });

    this.socket.on("message", (data) => {
      console.log("Received osc message");
      callback(data);
    });
  }

  send(text: string) {
    this.process?.stdin.write(text + "\n");
  }

  close() {
    this.process?.kill();
  }
}
