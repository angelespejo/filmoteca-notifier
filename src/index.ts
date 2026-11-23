import { runCli } from "./cli/run.js";

runCli(process.argv.slice(2))
  .then((code) => {
    if (code !== 0) process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error("Error fatal:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
