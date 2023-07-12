import { promisify } from "util";
import { Socket, createSocket } from "dgram";
import { exec, spawn, ChildProcessWithoutNullStreams } from "child_process";
//@ts-ignore
import { Duplex, compose } from "stream";
import { once } from "events";
import { createInterface } from "readline";
import { join } from "path";
import { createReadStream } from "fs";

import { TerminalMessage } from "@core/api";
import { Engine } from "../core/engine";

interface GHCIOptions {
  defaultBoot: boolean;
  customBootfiles: string[];
}

const defaultOpts: GHCIOptions = {
  defaultBoot: true,
  customBootfiles: [],
};

interface GHCIEvents {
  message: TerminalMessage;
}

export class GHCI extends Engine<GHCIEvents> {
  private socket: Promise<Socket>;
  private process: Promise<ChildProcessWithoutNullStreams>;

  private history: TerminalMessage[] = [];

  constructor(private options: GHCIOptions = defaultOpts) {
    super();

    this.socket = this.initSocket();
    this.process = this.initProcess(options);

    this.onListener["message"] = (listener) => {
      for (let message of this.history) {
        listener(message);
      }
    };
  }

  private initSocket() {
    return new Promise<Socket>((resolve) => {
      const socket = createSocket("udp4");
      socket.bind(0, "localhost", () => {
        resolve(socket);
      });

      // socket.on("message", (data) => {
      //   this.emit("message", data);
      // });
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

    const out = createInterface({ input: child.stdout });
    const err = createInterface({ input: child.stderr });

    if (defaultBoot) {
      await this.loadFile(await this.defaultBootfile(), child);
    }

    for (let path of customBootfiles) {
      await this.loadFile(path, child);
    }

    let outBatch: string[] | null = null;
    let errBatch: string[] | null = null;

    out.on("line", (data) => {
      if (!data.endsWith("> ")) {
        if (outBatch) {
          outBatch.push(data);
        } else {
          outBatch = [data];

          setTimeout(() => {
            if (outBatch) {
              let m: TerminalMessage = {
                level: "info",
                source: "Tidal",
                text: outBatch.join("\n").replace(/^(?:ghci[|>] )*/, ""),
              };

              outBatch = null;

              this.history.push(m);
              this.emit("message", m);
            }
          }, 20);
        }
      }
    });

    err.on("line", (data) => {
      if (data !== "") {
        if (errBatch) {
          errBatch.push(data);
        } else {
          errBatch = [data];

          setTimeout(() => {
            if (errBatch) {
              let m: TerminalMessage = {
                level: "error",
                source: "Tidal",
                text: errBatch.join("\n"),
              };

              errBatch = null;

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

  private async defaultBootfile() {
    const { stdout } = await promisify(exec)(
      'ghc -e "import Paths_tidal" -e "getDataDir>>=putStr"'
    );
    return join(stdout, "BootTidal.hs");
  }

  async send(text: string) {
    text = text
      .split(/(?<=\r?\n)/)
      .filter((l) => !l.match(/^\s*:set\s+prompt.*/))
      .join("");
    (await this.process).stdin.write(`:{\n${text}\n:}\n`);
  }

  async loadFile(path: string, child: ChildProcessWithoutNullStreams) {
    async function* process(source: AsyncIterable<string>) {
      let remainder = "";

      for await (let chunk of source) {
        for (let line of chunk.split(/(?<=\r?\n)/)) {
          line = remainder + line;
          if (line.match(/.*?\r?\n$/)) {
            if (!line.match(/^\s*:set\s+prompt.*/)) {
              yield line;
            }
            remainder = "";
          } else {
            remainder = line;
          }
        }
      }
    }

    const fileStream = compose(
      createReadStream(path).setEncoding("utf8"),
      process
    ) as Duplex;

    let completion = once(fileStream, "close");

    fileStream.pipe(child.stdin, { end: false });

    await completion;
  }

  private version: Promise<string> | undefined;

  getVersion() {
    if (!this.version) {
      this.version = promisify(exec)(
        'ghc -e "import Sound.Tidal.Version" -e "putStr tidal_version"'
      ).then(({ stdout }) => stdout);
    }

    return this.version;
  }

  async close() {
    let process = await this.process;

    if (!process.killed) {
      (await this.process).kill();
    }

    if (process.exitCode === null) {
      await new Promise<void>((resolve) => {
        process.once("close", () => {
          resolve();
        });
      });

      this.emit("stopped", undefined);
    }
  }

  async restart() {
    await this.close();

    this.process = this.initProcess(this.options);
    await this.process;
    this.emit("started", undefined);
  }
}
