import { promisify } from "util";
import { Socket, createSocket } from "dgram";
import { exec, spawn, ChildProcessWithoutNullStreams } from "child_process";
import { join } from "path";
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
    bootFiles = [];

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

    if (!disableEditorIntegration) {
      // this.outputFilters.push(
      //   /package flags have changed, resetting and loading new packages\.\.\./
      // );
      const integrationCode = generateIntegrationCode(await this.getVersion());
      await this.sendFile(integrationCode);

      // Disable reloading of Sound.Tidal.Context since it's already loaded
      this.wrapper.addInputFilter(
        `^${space}*import${space}+Sound\\.Tidal\\.Context.*(?:${EOL})?`
      );
    }

    if (useDefaultBootfile) {
      this.sendFile(await readFile(await this.defaultBootfile(), "utf-8"));
    }

    for (let path of bootFiles) {
      try {
        this.sendFile(await readFile(path, "utf-8"));
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

  private outputFilters: RegExp[] = [];

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

  async sendFile(code: string) {
    if (!this.wrapper)
      throw Error("Can't evaluate code before process is started");

    await this.wrapper.sendFile(code, (message) => {
      this.emit("message", message);
      this.history.push(message);
    });
  }

  async send(code: string) {
    if (!this.wrapper)
      throw Error("Can't evaluate code before process is started");

    let message = await this.wrapper.send(code);

    this.emit("message", message);
    this.history.push(message);
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

import { EOL } from "os";

interface ProcessWrapperEvents {
  prologue: string;
  prompt: string;
  epilogue: string;
}

class ProcessWrapper extends EventEmitter<ProcessWrapperEvents> {
  private processQueue: Promise<TerminalMessage | null>;

  protected prompt = "ghci> ";

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

  private inputFilters: RegExp[] = [];

  private async init() {
    // Get prologue
    await this.next("prompt");

    if (this.out.length > 0) {
      this.emit("prologue", this.out.join(EOL));
      this.out = [];
    }

    this.prompt = "\uE000";
    await this.evaluate(':set prompt "\uE000"');
    await this.evaluate(':set prompt-cont ""');

    this.addInputFilter(`^${space}*:set${space}+prompt.*(?:${EOL})?`);

    return null;
  }

  private async evaluate(code: string) {
    for (let filter of this.inputFilters) {
      code = code.replaceAll(filter, "");
    }

    let nextPrompt = this.next("prompt");

    console.log(`EVALUATE: "${code}"`);

    this.child.stdin.write(code + EOL);

    await nextPrompt;

    let result: TerminalMessage = {
      level: "info",
      text: "<No Output>",
      source: "Tidal",
    };

    if (this.out.length > 0) {
      result = { level: "info", text: this.out.join(EOL), source: "Tidal" };
      this.out = [];
    }

    if (this.error.length > 1) {
      result = { level: "error", text: this.out.join(EOL), source: "Tidal" };
      this.error = [];
    }

    console.log(`${result.level.toUpperCase()}: ${result.text}`);

    return result;
  }

  private async consumeStdout() {
    let runningLine: string = "";
    let chunk: string;

    for await (chunk of this.child.stdout) {
      console.log(`CHUNK: "${chunk}"`);
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
        if (remainder.startsWith(this.prompt)) {
          if (remainder !== this.prompt) {
            // If remainder has any characters after prompt, throw error
            throw Error(
              `Process printed unexpected characters after input prompt: "${remainder}"`
            );
          }

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
      console.log(`ERROR CHUNK: "${chunk}"`);
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

  public sendFile(code: string, callback: (message: TerminalMessage) => void) {
    let promises: Promise<TerminalMessage>[] = [];

    while (code.length > 0) {
      let match = code.match(codeRegExp);

      if (!match) throw Error(`Couldn't parse code:\n${code}`);

      if (match.index !== 0)
        throw Error(`Couldn't parse code:\n${code.slice(0, match.index)}`);

      let [{ length }, matchCode] = match;

      promises.push(
        this.send(matchCode).then((message) => {
          callback(message);
          return message;
        })
      );

      code = code.slice(length);
    }

    return Promise.all(promises);
  }

  public send(code: string) {
    if (code.split(EOL).length > 1 && !multilineRegExp.test(code)) {
      code = `:{${EOL}${code}${EOL}:}`;
    }

    let process = this.processQueue.then(() => this.evaluate(code));
    this.processQueue = process;
    return process;
  }

  public addInputFilter(filter: string | RegExp) {
    this.inputFilters.push(new RegExp(filter, "g"));
  }
}

const space = "[ \\t]";
const bracketLine = (bracket: string) => `^${space}*:${bracket}${space}*$`;
const nonBracketLine = (bracket: string) =>
  `^${space}*(?:[^:\\s].*|:[^${bracket}${EOL}].*|:${bracket}.*\\S.*|:)?$`;
const multiLineCode =
  bracketLine("{") +
  EOL +
  `(?:${nonBracketLine("}")}${EOL})*` +
  bracketLine("}");
const singleLineCode = nonBracketLine("{");
const codeRegExp = new RegExp(
  `((?:${multiLineCode})|(?:${singleLineCode}))(?:${EOL})?`,
  "m"
);
const multilineRegExp = new RegExp(multiLineCode, "m");
