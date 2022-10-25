import { program } from "commander";

export default program;

program.argument("[file]", "file to open");

// Tidal options
program
  .option("--no-default-boot", "Don't run the default BootTidal.hs file")
  .option("--boot <files...>", "List of Haskell files to be run on boot");

// Multiuser channels
program
  .option(
    "-r, --remote [session]",
    "Connect to the remote multiuser system. The optional session id can be used to join an existing session."
  )
  .option(
    "-l, --local [address]",
    "Join a multiuser session on the local network"
  );

program.parse();
