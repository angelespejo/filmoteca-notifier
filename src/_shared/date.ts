export const MADRID_TIMEZONE = "Europe/Madrid";

export interface CalendarDate {
  year: number;
  month: number; // 1-12
  day: number;
}

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export function parseIsoDate(value: string): CalendarDate | null {
  const match = ISO_DATE_RE.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1) return null;

  // Date.UTC normalizes invalid dates (e.g. 2026-02-31), so validate the result.
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function toIsoDate(date: CalendarDate): string {
  const year = String(date.year).padStart(4, "0");
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: CalendarDate, amount: number): CalendarDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + amount));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export function compareDates(a: CalendarDate, b: CalendarDate): number {
  return (
    Date.UTC(a.year, a.month - 1, a.day) -
    Date.UTC(b.year, b.month - 1, b.day)
  );
}

/** Calendar date in Madrid, independent from the host timezone. */
export function todayInMadrid(now: Date = new Date()): CalendarDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const values = new Map(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.get("year")),
    month: Number(values.get("month")),
    day: Number(values.get("day")),
  };
}

export function formatSpanishDate(date: CalendarDate): string {
  const month = MONTHS_ES[date.month - 1];
  const capitalized = month.charAt(0).toUpperCase() + month.slice(1);
  return `${date.day} ${capitalized} ${date.year}`;
}
