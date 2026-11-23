import type { AppConfig } from "../../config.js";
import { writeScrapedDays, type OutputFormat } from "../../output/index.js";
import { scrapeAndStore } from "../../pipeline.js";

export interface ManualOptions {
  res: OutputFormat;
  noProgram: boolean;
}

export async function runManualMode(config: AppConfig, options: ManualOptions): Promise<void> {
  if (options.res === "text") {
    console.log("  Scrapeo manual (sin notificaciones)");
    console.log();
  }

  const days = await scrapeAndStore(config, {
    command: "manual",
    format: options.res,
    noProgram: options.noProgram,
  });

  writeScrapedDays(days, options.res, { includeProgram: !options.noProgram });
}
