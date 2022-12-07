import EventEmitter from "events";
import { promisify } from "util";
import { Socket, createSocket } from "dgram";
import { exec, spawn, ChildProcessWithoutNullStreams } from "child_process";
import { createInterface } from "readline";
import { join } from "path";
import { createReadStream } from "fs";

import { message } from "../osc/osc";

export interface TerminalMessage {
  level: "info" | "error";
  source: string;
  text: string;
}

export class GHCI extends EventEmitter {
  private socket: Promise<Socket>;
  private process: Promise<ChildProcessWithoutNullStreams>;

  private history: TerminalMessage[] = [];

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

    const child = spawn("ghci", ["-XOverloadedStrings"], {
      env: {
        ...process.env,
        editor_port: port,
      },
    });

    child.stdin.write(':set prompt ""\n:set prompt-cont ""\n');

    const out = createInterface({ input: child.stdout });
    const err = createInterface({ input: child.stderr });

    const { stdout: path } = await promisify(exec)(
      "ghc -e 'import Paths_tidal' -e 'getDataDir>>=putStr'"
    );
    const bootPath = join(path, "BootTidal.hs");

    // Verbose Logging
    // console.log(`Loading Tidal Bootfile: ${bootPath}`);

    createReadStream(bootPath).pipe(child.stdin, { end: false });

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

              let m: TerminalMessage = {
                level: "info",
                source: "Tidal",
                text: outBatch.join("\n"),
              };

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

              let m: TerminalMessage = {
                level: "error",
                source: "Tidal",
                text: errBatch.join("\n"),
              };

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
    (await this.process).stdin.write(`:{\n${text}\n:}\n`);
  }

  async close() {
    (await this.process).kill();
  }
}
