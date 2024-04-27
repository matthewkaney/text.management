import { promisify } from "util";
import { Socket, createSocket } from "dgram";
import { exec, spawn, ChildProcessWithoutNullStreams } from "child_process";
import { join } from "path";
import { readFile } from "fs/promises";

import { OSCPacket } from "@core/osc/types";
import { parse } from "@core/osc/osc";
import { Evaluation, Log } from "@core/api";
import { Engine } from "../core/engine";

import { TidalSettings, normalizeTidalSettings } from "./settings";

import { generateIntegrationCode } from "./editor-integration";
import { EventEmitter } from "@core/events";

interface GHCIEvents {
  message: Evaluation | Log;
  now: number;
  osc: OSCPacket;
}

export class GHCI extends Engine<GHCIEvents> {
  private _settings: Promise<TidalSettings>;
  private socket: Promise<Socket>;
  private process: Promise<ChildProcessWithoutNullStreams>;

  private history: (Evaluation | Log)[] = [];

  constructor(private extensionFolder: string) {
    super();

    this._settings = this.loadSettings();
    this.socket = this.initSocket();
    this.process = this.initProcess();

    this.on("message", (message) => {
      this.history.push(message);
    });

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
        } else {
          this.emit("osc", message);
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

    this.wrapper.on("log", (message) => {
      this.emit("message", message);
    });

    const reportEvaluations = async (
      evaluations: AsyncGenerator<Evaluation>
    ) => {
      for await (let evaluation of evaluations) {
        this.emit("message", evaluation);
      }
    };

    if (!disableEditorIntegration) {
      // this.outputFilters.push(
      //   /package flags have changed, resetting and loading new packages\.\.\./
      // );
      const integrationCode = generateIntegrationCode(await this.getVersion());
      await reportEvaluations(this.send(integrationCode));

      // Disable reloading of Sound.Tidal.Context since it's already loaded
      this.wrapper.addInputFilter(
        /^[ \t]*import[ \t]+Sound\.Tidal\.Context.*$/m
      );
    }

    if (useDefaultBootfile) {
      reportEvaluations(this.sendFile(await this.defaultBootfile()));
    }

    for (let path of bootFiles) {
      try {
        reportEvaluations(this.sendFile(path));
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
          throw err;
        }

        this.emit("message", {
          level: "error",
          output: `The boot file "${path}" can't be found, so it wasn't loaded.`,
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
      output:
        "Tidal's settings have changed. Reboot Tidal to apply new settings.",
    });
  }

  async *sendFile(path: string) {
    let code = await readFile(path, "utf-8");

    for await (let evaluation of this.send(code)) yield evaluation;
  }

  async *send(code: string) {
    if (!this.wrapper)
      throw Error("Can't evaluate code before process is started");

    for await (let evaluation of this.wrapper.send(code)) {
      // TODO: Make this a setting?
      if (evaluation.output) {
        yield evaluation;
      }
    }
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

import { extractStatements } from "./parse";
import { EOL } from "os";

interface ProcessWrapperEvents {
  prologue: string;
  log: Log;
  prompt: string;
  epilogue: string;
}

class ProcessWrapper extends EventEmitter<ProcessWrapperEvents> {
  private runningProcess: Promise<void> | null = null;

  protected prompt = "ghci> ";

  constructor(private child: ChildProcessWithoutNullStreams) {
    super();

    child.stdout.setEncoding("utf-8");
    child.stderr.setEncoding("utf-8");

    this.runningProcess = this.init();

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

    this.addInputFilter(/^[ \t]*:set[ \t]+prompt.*$/m);
  }

  private async evaluate(code: string): Promise<Evaluation> {
    let nextPrompt = this.next("prompt");

    this.child.stdin.write(code + EOL);

    await nextPrompt;

    let input = code,
      success = true,
      output: string | undefined = undefined;

    if (this.error.length > 1) {
      success = false;
      output = this.error.join(EOL);
      this.error = [];
    }

    if (this.out.length > 0) {
      if (success) {
        output = this.out.join(EOL);
      } else {
        throw Error(`Unexpected text on stdout: "${this.out.join(EOL)}"`);
      }
      this.out = [];
    }

    return { input, success, output };
  }

  private async consumeStdout() {
    let runningLine: string = "";
    let chunk: string;

    for await (chunk of this.child.stdout) {
      if (!this.runningProcess) {
        // TODO: Use a timeout to batch outputs
        this.emit("log", { level: "info", output: chunk.trim() });
        continue;
      }

      let hasPrompt = false;
      let splits = chunk.split(EOL);

      for (let i = 0; i < splits.length; ++i) {
        let split = splits[i];

        if (i === 0) {
          split = runningLine + split;
          runningLine = "";
        }

        if (split.includes(this.prompt)) {
          hasPrompt = true;
          split = split.replace(this.prompt, "");
        }

        if (i < splits.length - 1) {
          this.out.push(split);
        } else {
          runningLine = runningLine + split;
        }
      }

      if (hasPrompt) {
        if (runningLine) {
          this.out.push(runningLine);
          runningLine = "";
        }

        // TODO: The value of this event is never used. It can probably be unused.
        this.emit("prompt", this.prompt);
      }
    }
  }

  private async consumeStderr() {
    let runningLine: string = "";
    let chunk: string;

    for await (chunk of this.child.stderr) {
      if (!this.runningProcess) {
        // TODO: Use a timeout to batch outputs
        this.emit("log", { level: "error", output: chunk.trim() });
        continue;
      }

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

  public async *send(code: string) {
    let resolve = () => {};

    if (this.runningProcess !== null) {
      await this.runningProcess;
    }

    this.runningProcess = new Promise<void>((res) => {
      resolve = res;
    }).then(() => {
      this.runningProcess = null;
    });

    for (let statement of extractStatements(code)) {
      for (let filter of this.inputFilters) {
        statement = statement.replaceAll(filter, "");
      }

      // Check for empty statements post-filter
      if (/^\s*$/.test(statement)) {
        continue;
      }

      if (statement.split(EOL).length > 1) {
        statement = `:{${EOL}${statement}${EOL}:}`;
      }

      yield this.evaluate(statement);
    }

    resolve();
  }

  public addInputFilter(filter: RegExp) {
    this.inputFilters.push(new RegExp(filter, filter.flags + "g"));
  }
}
