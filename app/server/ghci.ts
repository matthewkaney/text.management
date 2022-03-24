import EventEmitter from "events";
import { createSocket } from "dgram";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { createInterface } from "readline";

import { message } from "../osc/osc";

import bootCode from "bundle-text:./BootTidal.hs";

export class GHCI extends EventEmitter {
  private socket;
  private process?: ChildProcessWithoutNullStreams;

  private history: Buffer[] = [];

  private outBatch: string[] | null = null;
  private errBatch: string[] | null = null;

  constructor() {
    super();

    this.on("newListener", (event, listener) => {
      if (event === "message") {
        for (let message of this.history) {
          listener(message);
        }
      }
    });

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
          if (this.outBatch) {
            this.outBatch.push(data);
          } else {
            this.outBatch = [data];

            setTimeout(() => {
              if (this.outBatch) {
                const outBatch = this.outBatch;
                this.outBatch = null;

                let m = Buffer.from(
                  message("/tidal/reply", outBatch.join("\n"))
                );

                this.history.push(m);
                this.emit("message", m);
              }
            }, 20);
          }
        }
      });

      err.on("line", (data) => {
        if (data !== "") {
          if (this.errBatch) {
            this.errBatch.push(data);
          } else {
            this.errBatch = [data];

            setTimeout(() => {
              if (this.errBatch) {
                const errBatch = this.errBatch;
                this.errBatch = null;

                let m = Buffer.from(
                  message("/tidal/error", errBatch.join("\n"))
                );

                this.history.push(m);
                this.emit("message", m);
              }
            }, 20);
          }
        }
      });

      this.process.on("close", (code) => {
        console.log(`child process exited with code ${code}`);
      });
    });

    this.socket.on("message", (data) => {
      console.log("Received osc message");
      this.emit("message", data);
    });
  }

  send(text: string) {
    this.process?.stdin.write(`:{\n${text}\n:}\n`);
  }

  close() {
    this.process?.kill();
  }
}
