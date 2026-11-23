import cron from "node-cron";
import type { ScheduledTask } from "node-cron";
import type { AppConfig } from "./config.js";
import type { ScrapedDay } from "./types.js";
import { scrapeFilmoteca } from "./scraper.js";
import { writeScrapedDays, type OutputFormat } from "./output/index.js";
import { scrapeAndStore } from "./pipeline.js";
import type { StorageCommand } from "./storage/index.js";
import {
  notifyDays,
  type NotificationDependencies,
} from "./notifiers/dispatch.js";

const DEFAULT_CRON_TIMEZONE = "Europe/Madrid";

export interface RunDependencies extends NotificationDependencies {
  scrape?: typeof scrapeFilmoteca;
  print?: (days: ScrapedDay[]) => void;
  /** Output format used for terminal output and saved info files. */
  res?: OutputFormat;
  /** Storage subdirectory for this command. */
  command?: StorageCommand;
  /** Omit the programme URL and skip the PDF download. */
  noProgram?: boolean;
}

export { notifyDays };
export type { NotificationDependencies };

export async function runScrapeAndNotify(
  config: AppConfig,
  dependencies: RunDependencies = {},
): Promise<void> {
  const format = dependencies.res ?? "text";
  const command = dependencies.command ?? "server";
  const noProgram = dependencies.noProgram ?? false;
  const print =
    dependencies.print ??
    ((days: ScrapedDay[]) =>
      writeScrapedDays(days, format, { includeProgram: !noProgram }));
  const scrape =
    dependencies.scrape ??
    ((options: Parameters<typeof scrapeFilmoteca>[0]) =>
      scrapeAndStore(config, { ...options, command, format, noProgram }));

  if (format === "text") {
    console.log(`\n[${new Date().toISOString()}] Iniciando scraping...`);
  }

  const days = await scrape();
  print(days);
  await notifyDays(days, config, { ...dependencies, quiet: format !== "text" });
}

let scheduledTask: ScheduledTask | null = null;
let activeRun: Promise<void> | null = null;

export function startScheduler(
  config: AppConfig,
  dependencies: RunDependencies = {},
): void {
  if (scheduledTask) {
    console.warn("  ⚠ El programador ya está iniciado; se ignora la nueva llamada.");
    return;
  }

  if (!cron.validate(config.cron)) {
    throw new Error(`Expresión CRON no válida: "${config.cron}"`);
  }

  const timezone = config.cronTimezone ?? DEFAULT_CRON_TIMEZONE;
  if ((dependencies.res ?? "text") === "text") {
    console.log(`  Programador iniciado. Cron: ${config.cron} (${timezone})`);
    console.log();
  }

  scheduledTask = cron.schedule(
    config.cron,
    () => {
      if (activeRun) {
        console.warn("  ⚠ Hay una ejecución en curso; se omite este ciclo.");
        return;
      }

      activeRun = runScrapeAndNotify(config, dependencies)
        .catch((error: unknown) => {
          console.error("Error en ejecución programada:", error);
        })
        .finally(() => {
          activeRun = null;
        });
    },
    {
      timezone,
      noOverlap: true,
    },
  );
}

/** Stops the cron task and waits for the in-flight execution, if any. */
export async function stopScheduler(): Promise<void> {
  try {
    if (scheduledTask) {
      await scheduledTask.stop();
    }
  } finally {
    scheduledTask = null;

    if (activeRun) {
      await activeRun.catch(() => undefined);
      activeRun = null;
    }
  }
}
