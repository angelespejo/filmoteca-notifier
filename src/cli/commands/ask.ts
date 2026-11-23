import { stdin } from "node:process";
import type { AppConfig } from "../../config.js";
import { writeScrapedDays, type OutputFormat } from "../../output/index.js";
import { scrapeAndStore } from "../../pipeline.js";
import { notifyDays } from "../../notifiers/dispatch.js";
import { askBool } from "../../_shared/process.js";

export interface AskOptions {
  res: OutputFormat;
  noProgram: boolean;
  print: boolean;
  notify: boolean;
}

export async function runAskMode(config: AppConfig, options: AskOptions): Promise<void> {
  if (!stdin.isTTY) {
    throw new Error("El modo ask requiere una terminal interactiva.");
  }

  if (options.res === "text") {
    console.log("  Scrapeo con confirmación");
    console.log();
  }

  const print =
    options.print ||
    (await askBool("  ¿Quieres pintar el resultado en la terminal? (y/N): "));
  const notify =
    options.notify ||
    (await askBool("  ¿Enviar notificaciones? (y/N): "));

  const days = await scrapeAndStore(config, {
    command: "ask",
    format: options.res,
    noProgram: options.noProgram,
  });

  if (print) {
    writeScrapedDays(days, options.res, { includeProgram: !options.noProgram });
  }

  if (notify) {
    await notifyDays(days, config, { quiet: options.res !== "text" });
  } else if (options.res === "text") {
    console.log("  Notificaciones omitidas");
  }
}
