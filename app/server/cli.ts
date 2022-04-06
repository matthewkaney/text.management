import { Command } from "commander";

export const program = new Command();

program
  .option("--no-default-boot", "Don't run the default BootTidal.hs file")
  .option("--boot <files...>", "List of Haskell files to be run on boot");

program.parse();
