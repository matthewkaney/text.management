import { spawn } from "child_process";
import { createInterface } from "readline";

interface Response {
  type: "reply" | "error";
  data: string;
}

export class GHCI {
  private process = spawn("ghci");
  private out = createInterface({ input: this.process.stdout });
  private err = createInterface({ input: this.process.stderr });

  constructor(callback: (response: Response) => any) {
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
