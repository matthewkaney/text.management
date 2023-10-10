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

import { generateIntegrationCode } from "./editor-integration";
import { EventEmitter } from "@core/events";

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

  private wrapper: ProcessWrapper | null = null;

  private async initProcess() {
    let {
      "tidal.boot.disableEditorIntegration": disableEditorIntegration,
      "tidal.boot.useDefaultFile": useDefaultBootfile,
      "tidal.boot.customFiles": bootFiles,
    } = await this.settings;
    const port = (await this.socket).address().port.toString();

    // TEMPORARY:
    disableEditorIntegration = true;
    useDefaultBootfile = false;
    bootFiles = [];

    // Add filters for prettier code
    this.inputFilters.push(/^\s*:set\s+prompt.*/);

    // this.outputFilters.push(
    //   /^Loaded package environment from \S+$/,
    //   /^GHCi, version \d+\.\d+\.\d+: https:\/\/www.haskell.org\/ghc\/.*$/,
    //   /^ghc: signal: 15$/,
    //   /^Leaving GHCi\.$/
    // );

    // let stdout = new ReadableStream();

    const child = spawn("ghci", ["-XOverloadedStrings"], {
      env: {
        ...process.env,
        editor_port: port,
      },
    });

    this.wrapper = new ProcessWrapper(child);

    // this.initInterfaces(child);

    if (!disableEditorIntegration) {
      this.outputFilters.push(
        /package flags have changed, resetting and loading new packages\.\.\./
      );
      const integrationCode = generateIntegrationCode(await this.getVersion());
      child.stdin.write(integrationCode);

      // Disable reloading of Sound.Tidal.Context since it's already loaded
      this.inputFilters.push(/^\s*import\s+Sound\.Tidal\.Context.*/);
    }

    if (useDefaultBootfile) {
      await this.loadFile(await this.defaultBootfile(), child);
    }

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

    // child.on("close", (code) => {
    //   console.log(`child process exited with code ${code}`);
    // });

    return child;
  }

  private inputFilters: RegExp[] = [];
  private outputFilters: RegExp[] = [];

  private initInterfaces(child: ChildProcessWithoutNullStreams) {
    // const out = createInterface({ input: child.stdout });
    // const err = createInterface({ input: child.stderr });

    let outBatch: string[] | null = null;
    let errBatch: string[] | null = null;

    child.stdout.setEncoding("utf-8");

    const listen = async () => {
      for await (let chunk of child.stdout) {
        this.emit("message", { level: "info", source: "Tidal", text: chunk });
      }
    };

    listen();

    // out.on("line", (data) => {
    //   if (!data.endsWith("> ")) {
    //     if (this.outputFilters.some((filter) => data.match(filter))) return;

    //     if (outBatch) {
    //       outBatch.push(data);
    //     } else {
    //       outBatch = [data];

    //       setTimeout(() => {
    //         if (outBatch) {
    //           let m: TerminalMessage = {
    //             level: "info",
    //             source: "Tidal",
    //             text: outBatch.join("\n").replace(/^(?:ghci[|>] )*/, ""),
    //           };

    //           outBatch = null;

    //           this.history.push(m);
    //           this.emit("message", m);
    //         }
    //       }, 20);
    //     }
    //   }
    // });

    // err.on("line", (data) => {
    //   if (data !== "") {
    //     if (errBatch) {
    //       errBatch.push(data);
    //     } else {
    //       errBatch = [data];

    //       setTimeout(() => {
    //         if (errBatch) {
    //           let m: TerminalMessage = {
    //             level: "error",
    //             source: "Tidal",
    //             text: errBatch.join("\n"),
    //           };

    //           errBatch = null;

    //           this.history.push(m);
    //           this.emit("message", m);
    //         }
    //       }, 20);
    //     }
    //   }
    // });
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

  async send(code: string) {
    if (!this.wrapper)
      throw Error("Can't evaluate code before process is started");

    let text = (await this.wrapper.send(code)) ?? "<No output>";

    let message: TerminalMessage = { text, level: "info", source: "Tidal" };
    this.emit("message", message);
    this.history.push(message);

    // text = text
    //   .split(/(?<=\r?\n)/)
    //   .filter((line) => !this.inputFilters.some((filter) => line.match(filter)))
    //   .join("");
    // (await this.process).stdin.write(`:{\n${text}\n:}\n`);
  }

  async loadFile(path: string, child: ChildProcessWithoutNullStreams) {
    let inputFilters = this.inputFilters;
    async function* process(source: AsyncIterable<string>) {
      let remainder = "";

      for await (let chunk of source) {
        for (let line of chunk.split(/(?<=\r?\n)/)) {
          line = remainder + line;
          if (line.match(/.*?\r?\n$/)) {
            if (!inputFilters.some((filter) => line.match(filter))) {
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

    this.inputFilters = [];
    this.outputFilters = [];

    this.process = this.initProcess();
    await this.process;
    this.emit("started", undefined);
  }
}

import { EOL } from "os";

interface ProcessWrapperEvents {
  prologue: string;
  prompt: string;
  epilogue: string;
}

class ProcessWrapper extends EventEmitter<ProcessWrapperEvents> {
  private processQueue: Promise<string | null>;

  protected prompt: RegExp = /^ghci> $/;

  constructor(private child: ChildProcessWithoutNullStreams) {
    super();

    child.stdout.setEncoding("utf-8");
    child.stderr.setEncoding("utf-8");

    this.processQueue = this.init();

    this.consumeStdout();
    this.consumeStderr();
  }

  private out: string[] = [];
  private error: string[] = [];

  private async init() {
    // Get prologue
    await this.next("prompt");

    console.log(`===PROLOGUE===\n${this.out.join("\n")}\n==============`);
    this.out = [];

    this.prompt = /^\uE000|\uE001$/;
    await this.evaluate(':set prompt "\uE000"');
    await this.evaluate(':set prompt-cont "\uE001"');

    return null;
  }

  private async evaluate(code: string) {
    let nextPrompt = this.next("prompt");

    this.child.stdin.write(code + EOL);

    let prompt = await nextPrompt;

    let result: string | null = null;

    if (this.out.length > 0) {
      result = this.out.join(EOL);
      this.out = [];
    }

    if (this.error.length > 1) {
      result = this.error.slice(1).join(EOL);
      this.error = [];
    }

    return result;
  }

  private async consumeStdout() {
    let runningLine: string = "";
    let chunk: string;

    for await (chunk of this.child.stdout) {
      console.log(`CHUNK: ${chunk}`);
      let splits = chunk.split(EOL);
      let lines = splits.slice(0, -1);
      let [remainder] = splits.slice(-1);

      // Figure out where runningLine should be prepended
      if (lines.length > 0) {
        lines[0] = runningLine + lines[0];
      } else {
        remainder = runningLine + remainder;
      }

      runningLine = "";

      // Push any full lines onto the output
      this.out.push(...lines);

      // Check if remainder is a prompt
      if (typeof remainder === "string") {
        console.log(`REMAINDER: ${remainder}`);
        if (this.prompt.test(remainder)) {
          this.emit("prompt", remainder);
        } else {
          // We have some non-line, non-prompt characters. Save them for later.
          runningLine = remainder;
        }
      }
    }
  }

  private async consumeStderr() {
    let runningLine: string = "";
    let chunk: string;

    for await (chunk of this.child.stderr) {
      console.log(`ERROR CHUNK: ${chunk}`);
      let splits = chunk.split(EOL);
      let lines = splits.slice(0, -1);
      let [remainder] = splits.slice(-1);

      // Figure out where runningLine should be prepended
      if (lines.length > 0) {
        lines[0] = runningLine + lines[0];
      } else {
        remainder = runningLine + remainder;
      }

      runningLine = "";

      // Push any full lines onto the output
      this.error.push(...lines);

      // We have some non-line characters. Save them for later.
      runningLine = remainder;
    }
  }

  public send(code: string) {
    console.log(`SEND: ${code}`);
    this.processQueue = this.processQueue.then(() => this.evaluate(code));
    return this.processQueue;
  }
}
