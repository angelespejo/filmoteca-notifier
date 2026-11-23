import type { AppConfig, ScrapedDay } from "./types.js";
import { scrapeFilmoteca, type ScrapeOptions } from "./scraper.js";
import type { OutputFormat } from "./output/index.js";
import { saveScrapeResult, type StorageCommand } from "./storage/index.js";

export interface ScrapeAndStoreOptions extends ScrapeOptions {
  command: StorageCommand;
  format?: OutputFormat;
  noProgram?: boolean;
}

export async function scrapeAndStore(
  config: AppConfig,
  options: ScrapeAndStoreOptions,
): Promise<ScrapedDay[]> {
  const { command, format = "text", noProgram = false, ...scrapeOptions } = options;
  const days = await scrapeFilmoteca({
    ...scrapeOptions,
    includeProgram: !noProgram,
  });

  await saveScrapeResult(days, config, {
    command,
    format,
    includeProgram: !noProgram,
    now: options.now,
  });

  return days;
}
