import type { ScrapedDay } from "../types.js";
import {
  BASE_URL,
  DEFAULT_MAX_PAGES,
  PROGRAM_PAGE_URL,
} from "./constants.js";
import { createScrapeDeadline, fetchHtml } from "./fetch.js";
import { parseListingHtml, parseNextPageUrl, parseProgramUrl } from "./parser.js";
import { buildScrapedDays } from "./transform.js";
import type { RawListing, ScrapeRuntimeOptions } from "./types.js";

export async function scrapeHttp(options: ScrapeRuntimeOptions = {}): Promise<ScrapedDay[]> {
  const listings: RawListing[] = [];
  const visited = new Set<string>([BASE_URL]);
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
  const deadline = createScrapeDeadline();
  let url = BASE_URL;
  let currentPage = 1;

  while (currentPage <= maxPages) {
    let html: string;
    try {
      html = await fetchHtml(url, deadline);
    } catch (error) {
      if (currentPage === 1) throw error;
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(
        `[scraper] No se pudo abrir la página ${currentPage} (${reason}); se usa lo ya recopilado.`,
      );
      break;
    }

    listings.push(...parseListingHtml(html));

    const nextUrl = parseNextPageUrl(html, currentPage);
    if (!nextUrl || visited.has(nextUrl)) break;

    visited.add(nextUrl);
    url = nextUrl;
    currentPage++;
  }

  if (currentPage > maxPages) {
    console.warn(`[scraper] Límite de ${maxPages} páginas alcanzado.`);
  }

  const days = buildScrapedDays(listings, "", options);
  if ((options.includeProgram ?? true) === false || days.length === 0) return days;

  let programUrl = PROGRAM_PAGE_URL;
  try {
    programUrl = parseProgramUrl(await fetchHtml(PROGRAM_PAGE_URL, deadline));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[scraper] No se pudo leer el programa (${reason}); se usa la URL base.`);
  }

  return days.map((day) => ({ ...day, programUrl }));
}
