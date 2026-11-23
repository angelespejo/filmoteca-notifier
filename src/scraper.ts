import type { ScrapedDay } from "./types.js";
import { scrapeHttp } from "./scraping/http.js";
import type { ScrapeRuntimeOptions } from "./scraping/types.js";

export type ScrapeOptions = ScrapeRuntimeOptions;

/**
 * Scrapes the next days of programming using the lightweight HTTP pipeline.
 *
 * The public contract is unchanged: callers may keep using `scrapeFilmoteca()`.
 */
export async function scrapeFilmoteca(options: ScrapeOptions = {}): Promise<ScrapedDay[]> {
  return scrapeHttp(options);
}
