import { spawn } from "child_process";

export const ghci = spawn("ghci");

ghci.stdout.on("data", (data) => {
  console.log(`stdout: ${data}`);
});

ghci.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

ghci.on("close", (code) => {
  console.log(`child process exited with code ${code}`);
});
