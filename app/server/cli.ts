import { program } from "commander";

export default program;

program
  .argument("[file]", "file to open")
  .option("--no-default-boot", "Don't run the default BootTidal.hs file")
  .option("--boot <files...>", "List of Haskell files to be run on boot");

program.parse();
