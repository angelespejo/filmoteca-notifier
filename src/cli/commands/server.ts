import { exit } from "node:process";
import type { AppConfig } from "../../config.js";
import { writeScrapedDays, type OutputFormat } from "../../output/index.js";
import {
  runScrapeAndNotify,
  startScheduler,
  stopScheduler,
  type RunDependencies,
} from "../../scheduler.js";

export interface ServerOptions {
  res: OutputFormat;
  noProgram: boolean;
}

export async function runServerMode(config: AppConfig, options: ServerOptions): Promise<void> {
  if (options.res === "text") {
    console.log("  Filmoteca Notify arrancando...");
    console.log();
  }

  const dependencies: RunDependencies = {
    res: options.res,
    noProgram: options.noProgram,
    command: "server",
    print: (days) =>
      writeScrapedDays(days, options.res, {
        includeProgram: !options.noProgram,
      }),
  };

  startScheduler(config, dependencies);

  let initialRun: Promise<void> | null = null;
  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;

    if (options.res === "text") {
      console.log(`\n  ${signal} recibido; cerrando...`);
    }
    await stopScheduler();
    await initialRun?.catch(() => undefined);
    exit(0);
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  if (config.runOnStart !== false) {
    initialRun = runScrapeAndNotify(config, dependencies)
      .catch((error: unknown) => {
        console.error("Error en la ejecución inicial:", error);
      })
      .finally(() => {
        initialRun = null;
      });

    await initialRun;
  }
}
