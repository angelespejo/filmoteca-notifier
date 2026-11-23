import type { ScrapedDay } from "../types.js";
import { countMovies, STATUS_META } from "../_shared/format.js";
import { normalizeText } from "../_shared/parse.js";

function pad(value: string, width: number): string {
  return value.padEnd(width);
}

export function renderTable(days: ScrapedDay[], includeProgram = true): string {
  const rows = days.flatMap((day) =>
    day.movies.map((movie) => [
      normalizeText(day.date),
      normalizeText(movie.time),
      normalizeText(movie.title),
      STATUS_META[movie.status].label,
      normalizeText(movie.category),
      movie.infoUrl ?? "",
      movie.buyUrl ?? "",
    ]),
  );
  const headers = ["Día", "Hora", "Título", "Estado", "Categoría", "Info", "Compra"];
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index]?.length ?? 0)),
  );
  const formatRow = (row: string[]) => row.map((cell, index) => pad(cell, widths[index]!)).join("  ");
  const lines = [
    formatRow(headers),
    widths.map((width) => "─".repeat(width)).join("  "),
    ...rows.map(formatRow),
    "",
    `Total: ${countMovies(days)} películas en ${days.length} días`,
  ];

  const programUrl = days[0]?.programUrl;
  if (includeProgram && programUrl) lines.push(`Programa: ${programUrl}`);
  lines.push("");

  return lines.join("\n");
}
