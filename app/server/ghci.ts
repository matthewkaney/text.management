import { spawn, exec } from "child_process";
import { createInterface } from "readline";
import { createReadStream } from "fs";
import { join } from "path";

let bootPath: string | null = null;

exec(
  "ghc -e 'import Paths_tidal' -e 'getDataDir>>=putStr'",
  (error, stdout) => {
    console.log(`Found BootTidal path: ${stdout}`);
    bootPath = join(stdout, "BootTidal.hs");
  }
);

interface Response {
  type: "reply" | "error";
  data: string;
}

export class GHCI {
  private process = spawn("ghci");
  private out = createInterface({ input: this.process.stdout });
  private err = createInterface({ input: this.process.stderr });

  constructor(callback: (response: Response) => any) {
    if (bootPath) {
      createReadStream(bootPath).pipe(this.process.stdin, { end: false });
    }

    this.out.on("line", (data) => {
      if (!data.endsWith("> ")) {
        console.log(`"${data}"`);
        callback({ type: "reply", data });
      }
    });

    this.err.on("line", (data) => {
      if (data !== "") {
        console.error(`Error: ${data}`);
        callback({ type: "error", data });
      }
    });

    this.process.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
    });
  }

  send(text: string) {
    this.process.stdin.write(text + "\n");
  }

  close() {
    this.process.kill();
  }
}
