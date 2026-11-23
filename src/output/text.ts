import { styleText } from "node:util";
import type { ScrapedDay } from "../types.js";
import { countMovies, STATUS_META } from "../_shared/format.js";

export interface TextOptions {
  color?: boolean;
  includeProgram?: boolean;
}

export function renderText(days: ScrapedDay[], options: TextOptions = {}): string {
  const color = options.color ?? false;
  const includeProgram = options.includeProgram ?? true;
  const bold = (value: string) => (color ? styleText("bold", value) : value);
  const dim = (value: string) => (color ? styleText("dim", value) : value);
  const lines: string[] = [];
  const prefix = "    ✦";

  lines.push("");
  lines.push("═════════════════════════════════════════════════════");
  lines.push("  FILMOTECA ESPAÑOLA - Programación próximos días");
  lines.push("═════════════════════════════════════════════════════");

  for (const day of days) {
    lines.push("");
    lines.push(`  📅 ${day.date}`);
    lines.push(`  ${"─".repeat(50)}`);

    for (const movie of day.movies) {
      lines.push("");
      lines.push(bold(`  ${movie.title}`));
      lines.push(dim(`  ${movie.description}`));
      lines.push(`${prefix} 👤 ${movie.directors.join(", ")}`);
      lines.push(`${prefix} 🕐 ${movie.date} - ${movie.time}`);
      lines.push(`${prefix} 🏷️  ${movie.category}`);

      const status = STATUS_META[movie.status];
      lines.push(`${prefix} ${status.icon} ${status.label}`);
      if (movie.infoUrl) lines.push(`${prefix} ℹ️  ${movie.infoUrl}`);
      if (movie.buyUrl) lines.push(`${prefix} 🔗 ${movie.buyUrl}`);
      lines.push("");
    }
  }

  const total = countMovies(days);
  const programUrl = days[0]?.programUrl;
  lines.push("═══════════════════════════════════════════════");
  lines.push(`  Total: ${total} películas en ${days.length} días`);
  if (includeProgram && programUrl) {
    lines.push(`  📋 Programa del mes: ${programUrl}`);
  }
  lines.push("  🎟️  Entradas: https://entradasfilmoteca.sacatuentrada.es/");
  lines.push("═══════════════════════════════════════════════");
  lines.push("");

  return lines.join("\n");
}
