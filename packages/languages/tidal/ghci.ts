import { promisify } from "util";
import { Socket, createSocket } from "dgram";
import { exec, spawn, ChildProcessWithoutNullStreams } from "child_process";
//@ts-ignore
import { Duplex, compose } from "stream";
import { once } from "events";
import { createInterface } from "readline";
import { join } from "path";
import { createReadStream } from "fs";
import { readFile } from "fs/promises";

import { parse } from "@core/osc/osc";
import { TerminalMessage } from "@core/api";
import { Engine } from "../core/engine";

import { TidalSettings, normalizeTidalSettings } from "./settings";

//@ts-ignore
import preBoot from "bundle-text:./PreBoot.hs";

interface GHCIEvents {
  message: TerminalMessage;
  now: number;
  openSettings: string;
}

export class GHCI extends Engine<GHCIEvents> {
  private _settings: Promise<TidalSettings>;
  private socket: Promise<Socket>;
  private process: Promise<ChildProcessWithoutNullStreams>;

  private history: TerminalMessage[] = [];

  constructor(private extensionFolder: string) {
    super();

    this._settings = this.loadSettings();
    this.socket = this.initSocket();
    this.process = this.initProcess();

    this.onListener["message"] = (listener) => {
      for (let message of this.history) {
        listener(message);
      }
    };
  }

  private async loadSettings() {
    try {
      const settings = JSON.parse(await readFile(this.settingsPath, "utf-8"));

      // TODO: Update/validate settings, etc
      return normalizeTidalSettings(settings);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }

      return normalizeTidalSettings({});
    }
  }

  private initSocket() {
    return new Promise<Socket>((resolve) => {
      const socket = createSocket("udp4");
      socket.bind(0, "localhost", () => {
        resolve(socket);
      });

      socket.on("message", (data) => {
        let message = parse(data);

        if ("address" in message && message.address === "/now") {
          if (typeof message.args[0] === "number") {
            this.emit("now", message.args[0]);
          }
        }
      });
    });
  }

  private async initProcess() {
    const {
      "boot.useDefaultFile": useDefaultBootfile,
      "boot.customFiles": bootFiles,
    } = await this.settings;
    const port = (await this.socket).address().port.toString();

    const child = spawn("ghci", ["-XOverloadedStrings"], {
      env: {
        ...process.env,
        editor_port: port,
      },
    });

    const out = createInterface({ input: child.stdout });
    const err = createInterface({ input: child.stderr });

    child.stdin.write(preBoot);

    if (useDefaultBootfile) {
      await this.loadFile(await this.defaultBootfile(), child);
    }

    console.log(bootFiles);

    for (let path of bootFiles) {
      try {
        await this.loadFile(path, child);
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
          throw err;
        }

        this.emit("message", {
          level: "error",
          text: `The boot file "${path}" can't be found, so it wasn't loaded.`,
          source: "Tidal",
        });
      }
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

  async reloadSettings() {
    this._settings = this.loadSettings();

    // TODO: Some sort of check that settings have actually changed?
    this.emit("message", {
      level: "info",
      source: "Tidal",
      text: "Tidal's settings have changed. Reboot Tidal to apply new settings.",
    });
  }

  async send(text: string) {
    text = text
      .split(/(?<=\r?\n)/)
      .filter((l) => !l.match(/^\s*:set\s+prompt.*/))
      .filter((l) => !l.match(/^\s*import\s+Sound\.Tidal\.Context.*/))
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
            if (
              !line.match(/^\s*:set\s+prompt.*/) &&
              !line.match(/^\s*import\s+Sound\.Tidal\.Context.*/)
            ) {
              yield line;
            }
            remainder = "";
          } else {
            remainder = line;
          }
        }
      }

      yield remainder + "\n";
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

  get settings() {
    return this._settings;
  }

  get settingsPath() {
    return join(this.extensionFolder, "settings.json");
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

    this.process = this.initProcess();
    await this.process;
    this.emit("started", undefined);
  }
}
