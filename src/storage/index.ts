import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type { AppConfig, ScrapedDay } from "../types.js";
import { formatScrapedDays, outputExtension, type OutputFormat } from "../output/index.js";
import { sanitizeUrl } from "../_shared/html.js";
import { downloadPdf } from "./pdf.js";

export type StorageCommand = "server" | "manual" | "ask";

export interface SaveScrapeOptions {
  command: StorageCommand;
  format: OutputFormat;
  includeProgram?: boolean;
  now?: Date;
}

export interface SavedScrape {
  infoPath: string;
  pdfPath?: string;
}

function timestampForFile(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

async function writeAtomic(file: string, data: string | Uint8Array): Promise<void> {
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;

  try {
    await writeFile(temporary, data);
    await rename(temporary, file);
  } catch (error) {
    await rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
}

function uniqueBase(directory: string, timestamp: string, extension: string): string {
  let base = join(directory, timestamp);
  let suffix = 0;

  while (
    existsSync(`${base}-info.${extension}`) ||
    existsSync(`${base}-programa.pdf`)
  ) {
    suffix++;
    base = join(directory, `${timestamp}-${suffix}`);
  }

  return base;
}

function isPdfUrl(value: string): boolean {
  const url = sanitizeUrl(value);
  if (!url) return false;

  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

/**
 * Saves the formatted scrape result and, when available, the monthly PDF.
 * Storage is optional and never fails the surrounding scrape.
 */
export async function saveScrapeResult(
  days: ScrapedDay[],
  config: AppConfig,
  options: SaveScrapeOptions,
): Promise<SavedScrape | undefined> {
  if (!config.dataDir) return undefined;

  const directory = resolve(config.dataDir, options.command);
  const timestamp = timestampForFile(options.now ?? new Date());
  const extension = outputExtension(options.format);
  const base = uniqueBase(directory, timestamp, extension);
  const infoPath = `${base}-info.${extension}`;
  const includeProgram = options.includeProgram ?? true;
  let pdfPath: string | undefined;

  try {
    await writeAtomic(
      infoPath,
      formatScrapedDays(days, options.format, { color: false, includeProgram }),
    );

    const programUrl = days[0]?.programUrl;
    if (includeProgram && programUrl && isPdfUrl(programUrl)) {
      try {
        const pdf = await downloadPdf(programUrl);
        pdfPath = `${base}-programa.pdf`;
        await writeAtomic(pdfPath, pdf);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        console.warn(`[storage] No se pudo guardar el PDF (${reason}).`);
      }
    }

    return { infoPath, pdfPath };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[storage] No se pudo guardar el resultado (${reason}).`);
    return undefined;
  }
}
