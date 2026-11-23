import type { ScrapedDay } from "../types.js";
import { STATUS_META } from "../_shared/format.js";

function csvCell(value: string | undefined): string {
  const text = value ?? "";
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function renderCsv(days: ScrapedDay[], includeProgram = true): string {
  const headers = [
    "Fecha",
    "Hora",
    "Título",
    "Directores",
    "Estado",
    "Categoría",
    "Info",
    "Compra",
    ...(includeProgram ? ["Programa"] : []),
  ];
  const lines = [headers.join(",")];

  for (const day of days) {
    for (const movie of day.movies) {
      const row = [
        movie.date,
        movie.time,
        movie.title,
        movie.directors.join(", "),
        STATUS_META[movie.status].label,
        movie.category,
        movie.infoUrl ?? "",
        movie.buyUrl ?? "",
        ...(includeProgram ? [day.programUrl] : []),
      ];
      lines.push(row.map(csvCell).join(","));
    }
  }

  return `${lines.join("\n")}\n`;
}
