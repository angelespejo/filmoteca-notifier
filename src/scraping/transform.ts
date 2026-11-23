import type { Movie, ScrapedDay } from "../types.js";
import {
  addDays,
  compareDates,
  formatSpanishDate,
  parseIsoDate,
  todayInMadrid,
  toIsoDate,
  type CalendarDate,
} from "../_shared/date.js";
import { sanitizeUrl } from "../_shared/html.js";
import {
  normalizeDescription,
  normalizeText,
  parseDirector,
  parseStatus,
  parseTime,
} from "../_shared/parse.js";
import { DEFAULT_DAYS_AHEAD } from "./constants.js";
import type { RawListing, ScrapeRuntimeOptions } from "./types.js";

interface DayGroup {
  date: CalendarDate;
  movies: Movie[];
}

function toMovie(item: RawListing, time: string): Movie {
  return {
    title: item.title,
    directors: parseDirector(item.director),
    description: normalizeDescription(item.description),
    status: parseStatus(item.actionText),
    buyUrl: sanitizeUrl(item.buyUrl) ?? undefined,
    infoUrl: sanitizeUrl(item.infoUrl) ?? undefined,
    date: item.fecha,
    time,
    category: normalizeText(item.category),
  };
}

/**
 * Applies the date window, deduplication, grouping and formatting shared by
 * the scraping pipeline.
 */
export function buildScrapedDays(
  listings: RawListing[],
  programUrl: string,
  options: Pick<ScrapeRuntimeOptions, "now" | "daysAhead"> = {},
): ScrapedDay[] {
  const today = todayInMadrid(options.now);
  const startDate = addDays(today, 1);
  const endDate = addDays(today, (options.daysAhead ?? DEFAULT_DAYS_AHEAD) + 1);

  const grouped = new Map<string, DayGroup>();
  const seen = new Set<string>();

  for (const item of listings) {
    const date = parseIsoDate(item.fecha);
    if (!date) continue;
    if (compareDates(date, startDate) < 0 || compareDates(date, endDate) >= 0) continue;

    const time = parseTime(item.description);
    const dedupeKey = `${toIsoDate(date)}|${item.title}|${time}|${item.category}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const isoDate = toIsoDate(date);
    const group = grouped.get(isoDate) ?? { date, movies: [] };
    group.movies.push(toMovie(item, time));
    grouped.set(isoDate, group);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, group]) => ({
      date: formatSpanishDate(group.date),
      movies: group.movies,
      programUrl,
    }));
}
