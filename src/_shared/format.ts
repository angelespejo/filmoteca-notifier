import type { Movie, ScrapedDay } from "../types.js";

export const STATUS_META: Record<
  Movie["status"],
  { icon: string; label: string }
> = {
  available: { icon: "✅", label: "Comprar" },
  sold_out: { icon: "❌", label: "Agotado" },
  upcoming: { icon: "⏳", label: "Próximamente" },
};

export function countMovies(days: ScrapedDay[]): number {
  return days.reduce((total, day) => total + day.movies.length, 0);
}
