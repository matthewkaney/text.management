import { promisify } from "util";
import { Socket, createSocket } from "dgram";
import { exec, spawn, ChildProcessWithoutNullStreams } from "child_process";
import { homedir } from "os";
import { join } from "path";
import { readFile } from "fs/promises";

import { message } from "@core/osc/osc";
import { Evaluation, Log } from "@core/api";
import { Engine } from "../core/engine";
import { EventDisconnect, OSCSocket } from "../core/oscsocket";

import { Config, ConfigExtension } from "@core/state";
// export { TidalSettingsSchema } from "./settings";
// import { TidalSettingsSchema } from "./settings";

// import { generateIntegrationCode } from "./editor-integration";
import { NTPTime, OSCMessage } from "@core/osc/types";
import { EventEmitter } from "@core/events";

interface ZwirnZIEvents {
  message: Evaluation | Log;
}

export class ZwirnZI extends Engine<ZwirnZIEvents> {
  // private settings: ConfigExtension<typeof TidalSettingsSchema>;

  private socket: Promise<OSCSocket>;
  private process: Promise<ChildProcessWithoutNullStreams>;

  private history: (Evaluation | Log)[] = [];

  constructor() {
    super();

    // this.settings = settings.extend(TidalSettingsSchema);

    // this.settings.on("change", () => {
    //   this.reloadSettings;
    // });

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

  private async initSocket() {
    const socket = new OSCSocket(0, 2323);

    await socket.bound;

    return socket;
  }

  private async initProcess() {
    // const {
    //   "tidal.boot.disableEditorIntegration": disableEditorIntegration,
    //   "tidal.boot.useDefaultFile": useDefaultBootfile,
    //   "tidal.boot.customFiles": bootFiles,
    // } = this.settings.data;
    await this.socket;

    // this.outputFilters.push(
    //   /^Loaded package environment from \S+$/,
    //   /^GHCi, version \d+\.\d+\.\d+: https:\/\/www.haskell.org\/ghc\/.*$/,
    //   /^ghc: signal: 15$/,
    //   /^Leaving GHCi\.$/
    // );

    // let stdout = new ReadableStream();

    // const child = spawn(join(homedir(), "Documents/zwirnzi"), [
    //   "--ci.listener=true",
    // ]);

    const child = spawn(
      "cabal",
      ["run", "zwirnzi", "--", "--ci.listener=true"],
      {
        cwd: "../../../zwirnzi/",
      }
    );

    // this.wrapper = new ProcessWrapper(child);

    // this.wrapper.on("log", (message) => {
    //   this.emit("message", message);
    // });

    // if (!disableEditorIntegration) {
    //   // this.outputFilters.push(
    //   //   /package flags have changed, resetting and loading new packages\.\.\./
    //   // );
    //   const integrationCode = generateIntegrationCode(await this.getVersion());
    //   await this.send(integrationCode);
    // }

    // if (useDefaultBootfile) {
    //   await this.sendFile(await this.defaultBootfile());
    // }

    // for (let path of bootFiles ?? []) {
    //   try {
    //     await this.sendFile(path);
    //   } catch (err) {
    //     if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
    //       throw err;
    //     }

    //     this.emit("message", {
    //       level: "error",
    //       text: `The boot file "${path}" can't be found, so it wasn't loaded.`,
    //     });
    //   }
    // }

    child.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
    });

    return child;
  }

  private async reloadSettings() {
    // TODO: Some sort of check that settings have actually changed?
    this.emit("message", {
      level: "info",
      text: "Tidal's settings have changed. Reboot Tidal to apply new settings.",
    });
  }

  async sendFile(path: string) {
    let code = await readFile(path, "utf-8");

    await this.send(code);
  }

  async send(code: string) {
    let socket = await this.socket;

    socket.send(message("/eval", code));

    let offOK: EventDisconnect;
    let offError: EventDisconnect;

    let { promise, resolve } = Promise.withResolvers<OSCMessage>();

    function handler(response: OSCMessage) {
      resolve(response);
      offOK();
      offError();
    }

    offOK = socket.once("/eval/value", handler);
    offError = socket.once("/eval/error", handler);

    return promise;
    // if (!this.wrapper)
    //   throw Error("Can't evaluate code before process is started");
    // for await (let evaluation of this.wrapper.send(code)) {
    //   // TODO: Make this a setting?
    //   if (evaluation.text) {
    //     this.emit("message", evaluation);
    //   }
    // }
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
