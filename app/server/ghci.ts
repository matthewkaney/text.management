import { spawn } from "child_process";

const ghci = spawn("ghci");

ghci.stdout.on("data", (data) => {
  data = data.toString("utf-8");
  if (!data.toString().endsWith("> ")) {
    console.log(`"${data}"`);
  }
});

ghci.stderr.on("data", (data) => {
  console.error(`Error: ${data}`);
});

ghci.on("close", (code) => {
  console.log(`child process exited with code ${code}`);
});
