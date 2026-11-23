import type { ScrapedDay } from "../types.js";
import type { AppConfig } from "../config.js";
import { countMovies, STATUS_META } from "../_shared/format.js";
import { sanitizeUrl } from "../_shared/html.js";
import { normalizeText } from "../_shared/parse.js";

export function buildMessage(days: ScrapedDay[]): string {
  let message = "🎬 *Filmoteca Española*\n\n";

  for (const day of days) {
    message += `*${normalizeText(day.date)}*\n`;

    for (const movie of day.movies) {
      const status = STATUS_META[movie.status];
      message += `  ${status.icon} ${normalizeText(movie.title)} - ${movie.directors.map(normalizeText).join(", ")} [${normalizeText(movie.time)}]\n`;

      const infoUrl = sanitizeUrl(movie.infoUrl);
      if (infoUrl) {
        message += `     ℹ️  ${infoUrl}\n`;
      }

      const buyUrl = sanitizeUrl(movie.buyUrl);
      if (buyUrl) {
        message += `     🔗 ${buyUrl}\n`;
      }
    }

    message += "\n";
  }

  return message.trim();
}

export async function sendGotify(days: ScrapedDay[], config: AppConfig): Promise<void> {
  if (!config.gotifyUrl || !config.gotifyToken) {
    throw new Error("Gotify no configurado: se requieren GOTIFY_URL y GOTIFY_TOKEN.");
  }

  const total = countMovies(days);
  let message = buildMessage(days);

  const programUrl = sanitizeUrl(days[0]?.programUrl);
  if (programUrl) {
    message += `\n📋 Programa: ${programUrl}`;
  }
  message += "\n🎟️ Entradas: https://entradasfilmoteca.sacatuentrada.es/";

  const baseUrl = config.gotifyUrl.replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gotify-Key": config.gotifyToken,
    },
    body: JSON.stringify({
      title: `🎬 Filmoteca - ${total} películas`,
      message,
      priority: 5,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Gotify error: ${response.status} ${response.statusText}`);
  }

  console.log("  ✓ Notificación enviada a Gotify");
}
