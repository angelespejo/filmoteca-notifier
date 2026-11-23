import type { Movie } from "../types.js";

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Keeps descriptions identical between DOM and HTML parsers. */
export function normalizeDescription(value: string): string {
  return normalizeText(value).replace(/\s+([*.,;:!?])/g, "$1");
}

export function parseStatus(text: string): Movie["status"] {
  const normalized = normalizeText(text).toLowerCase();
  if (normalized.includes("agotado")) return "sold_out";
  if (normalized.includes("comprar")) return "available";
  return "upcoming";
}

export function parseDirector(text: string): string[] {
  if (!text) return [];

  return text
    .split(/[,;]/)
    .map((director) => normalizeText(director))
    .filter((director) => director.length > 0);
}

/** Extracts the first valid HH:MM time from a listing description. */
export function parseTime(description: string): string {
  const match = /(?<!\d)([01]?\d|2[0-3]):([0-5]\d)(?!\d)/.exec(description);
  if (!match) return "";

  return `${match[1].padStart(2, "0")}:${match[2]}`;
}
