import { Socket, createSocket } from "dgram";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { createInterface } from "readline";

import { Engine } from "../base/engine";

import { message } from "../../osc/osc";

export class SCLang extends Engine {
  private socket: Promise<Socket>;
  private process: Promise<ChildProcessWithoutNullStreams>;

  private history: Buffer[] = [];

  private outBatch: string[] | null = null;
  private errBatch: string[] | null = null;

  constructor() {
    super();

    this.socket = this.initSocket();
    this.process = this.initProcess();

    this.on("newListener", (event, listener) => {
      if (event === "message") {
        for (let message of this.history) {
          listener(message);
        }
      }
    });
  }

  private initSocket() {
    return new Promise<Socket>((resolve) => {
      const socket = createSocket("udp4");
      socket.bind(0, "localhost", () => {
        resolve(socket);
      });

      socket.on("message", (data) => {
        this.emit("message", data);
      });
    });
  }

  private async initProcess() {
    const port = (await this.socket).address().port.toString();

    const child = spawn(
      "/Applications/SuperCollider.app/Contents/MacOS/sclang"
    );

    //child.stdin.write(':set prompt ""\n:set prompt-cont ""\n');

    const out = createInterface({ input: child.stdout });
    const err = createInterface({ input: child.stderr });

    out.on("line", (data) => {
      if (data.startsWith("sc3> ")) {
        data = data.slice(5);
      }

      if (this.outBatch) {
        this.outBatch.push(data);
      } else {
        this.outBatch = [data];

        setTimeout(() => {
          if (this.outBatch) {
            const outBatch = this.outBatch;
            this.outBatch = null;

            let m = Buffer.from(message("/tidal/reply", outBatch.join("\n")));

            this.history.push(m);
            this.emit("message", m);
          }
        }, 20);
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

              let m = Buffer.from(message("/tidal/error", errBatch.join("\n")));

              this.history.push(m);
              this.emit("message", m);
            }
          }, 20);
        }
      }
    });

    child.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
    });

    return child;
  }

  async send(text: string) {
    (await this.process).stdin.write(`${text}\x0f`);
  }

  async close() {
    (await this.process).kill();
  }
}
