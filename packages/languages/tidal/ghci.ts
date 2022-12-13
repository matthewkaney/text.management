import { promisify } from "util";
import { Socket, createSocket } from "dgram";
import { exec, spawn, ChildProcessWithoutNullStreams } from "child_process";
import { createInterface } from "readline";
import { join } from "path";
import { createReadStream } from "fs";

import { Engine } from "../core/engine";

import { message } from "../../../app/osc/osc";
interface GHCIOptions {
  defaultBoot: boolean;
  customBootfiles: string[];
}

const defaultOpts: GHCIOptions = {
  defaultBoot: true,
  customBootfiles: [],
};

export class GHCI extends Engine {
  private socket: Promise<Socket>;
  private process: Promise<ChildProcessWithoutNullStreams>;

  private history: Buffer[] = [];

  private outBatch: string[] | null = null;
  private errBatch: string[] | null = null;

  constructor(opts: GHCIOptions = defaultOpts) {
    super();

    this.socket = this.initSocket();
    this.process = this.initProcess(opts);

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

  private async initProcess({ defaultBoot, customBootfiles }: GHCIOptions) {
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

    const loadFile = (path: string) =>
      new Promise<void>((resolve) => {
        const stream = createReadStream(path);

        stream.on("close", () => {
          // Verbose Logging
          // console.log(`Loaded bootfile: ${path}`);
          resolve();
        });

        stream.pipe(child.stdin, { end: false });
      });

    if (defaultBoot) {
      await loadFile(await this.defaultBootfile());
    }

    for (let path of customBootfiles) {
      await loadFile(path);
    }

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

              let m = Buffer.from(message("/tidal/reply", outBatch.join("\n")));

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

  private defaultBootfile() {
    return promisify(exec)(
      "ghc -e 'import Paths_tidal' -e 'getDataDir>>=putStr'"
    ).then(({ stdout }) => join(stdout, "BootTidal.hs"));
  }

  async send(text: string) {
    (await this.process).stdin.write(`:{\n${text}\n:}\n`);
  }

  async close() {
    (await this.process).kill();
  }
}
