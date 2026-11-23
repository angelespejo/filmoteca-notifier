import type { ScrapedDay } from "../types.js";
import { countMovies, STATUS_META } from "../_shared/format.js";
import { normalizeText } from "../_shared/parse.js";

function md(value: string): string {
  return normalizeText(value).replace(/([\\`*_[\]<>])/g, "\\$1");
}

function link(label: string, url: string | undefined): string {
  return url ? `[${label}](${url})` : "";
}

export function renderMarkdown(days: ScrapedDay[], includeProgram = true): string {
  const lines: string[] = ["# Filmoteca Española", ""];
  const programUrl = days[0]?.programUrl;

  if (includeProgram && programUrl) {
    lines.push(`[📋 Programa del mes](${programUrl})`, "");
  }
  lines.push("[🎟️ Comprar entradas](https://entradasfilmoteca.sacatuentrada.es/)", "");

  for (const day of days) {
    lines.push(`## 📅 ${md(day.date)}`, "");

    for (const movie of day.movies) {
      lines.push(`### 🎬 ${md(movie.title)}`, "");
      lines.push(`- **Hora:** ${md(movie.time || "—")}`);
      lines.push(`- **Fecha:** ${md(movie.date)}`);
      if (movie.directors.length > 0) {
        lines.push(`- **Directores:** ${md(movie.directors.join(", "))}`);
      }
      if (movie.category) {
        lines.push(`- **Categoría:** ${md(movie.category)}`);
      }

      const status = STATUS_META[movie.status];
      lines.push(`- **Estado:** ${status.icon} ${status.label}`);

      if (movie.description) {
        lines.push(`- **Sinopsis:** ${md(movie.description)}`);
      }
      if (movie.infoUrl) {
        lines.push(`- **Info:** ${link("ℹ️ Más información", movie.infoUrl)}`);
      }
      if (movie.buyUrl) {
        lines.push(`- **Compra:** ${link("🔗 Comprar", movie.buyUrl)}`);
      }
      lines.push("", "---", "");
    }
  }

  lines.push(`**Total:** ${countMovies(days)} películas en ${days.length} días`, "");
  return lines.join("\n");
}
