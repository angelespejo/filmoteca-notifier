import nodemailer from "nodemailer";
import type { Movie, ScrapedDay } from "../types.js";
import type { AppConfig } from "../config.js";
import { countMovies, STATUS_META } from "../_shared/format.js";
import { escapeHtml, sanitizeUrl } from "../_shared/html.js";

function renderStatusBadge(movie: Movie): string {
  const status = STATUS_META[movie.status];
  const label = `${status.icon} ${status.label}`;
  const buyUrl = sanitizeUrl(movie.buyUrl);

  if (movie.status === "available" && buyUrl) {
    return `<a href="${escapeHtml(buyUrl)}" style="background:#4CAF50;color:white;padding:2px 8px;border-radius:4px;text-decoration:none;display:inline-block">${escapeHtml(label)}</a>`;
  }

  const background =
    movie.status === "available" ? "#4CAF50" : movie.status === "sold_out" ? "#f44336" : "#FF9800";
  return `<span style="background:${background};color:white;padding:2px 8px;border-radius:4px">${escapeHtml(label)}</span>`;
}

export function buildHtml(days: ScrapedDay[]): string {
  const programUrl = sanitizeUrl(days[0]?.programUrl);
  let html = "<h1>🎬 Programación Filmoteca Española</h1>";

  if (programUrl) {
    html += `<p><a href="${escapeHtml(programUrl)}" style="font-size:16px">📋 Programa completo del mes</a></p>`;
  }

  html += `<p><a href="https://entradasfilmoteca.sacatuentrada.es/" style="font-size:16px">🎟️ Comprar entradas</a></p>`;

  for (const day of days) {
    html += `<h2>📅 ${escapeHtml(day.date)}</h2><hr>`;

    for (const movie of day.movies) {
      const infoUrl = sanitizeUrl(movie.infoUrl);
      html += `
        <div style="margin-bottom:16px;padding:12px;border:1px solid #ddd;border-radius:8px">
          <h3 style="margin:0">${escapeHtml(movie.title)}</h3>
          <p style="margin:4px 0;color:#555"><strong>Director/es:</strong> ${escapeHtml(movie.directors.join(", "))}</p>
          <p style="margin:4px 0;color:#555">${escapeHtml(movie.description)}</p>
          <p style="margin:4px 0"><strong>Fecha:</strong> ${escapeHtml(movie.date)} - ${escapeHtml(movie.time)}</p>
          <p style="margin:4px 0"><strong>Categoría:</strong> ${escapeHtml(movie.category)}</p>
          <p style="margin:8px 0">${renderStatusBadge(movie)}</p>
          ${infoUrl ? `<p style="margin:4px 0"><a href="${escapeHtml(infoUrl)}">ℹ️ Más información</a></p>` : ""}
        </div>
      `;
    }
  }

  return html;
}

export async function sendEmail(days: ScrapedDay[], config: AppConfig): Promise<void> {
  const { smtpHost, smtpPort, smtpUser, smtpPass, emailFrom, emailTo } = config;
  if (!smtpHost || !smtpPort || !emailFrom || !emailTo) {
    throw new Error(
      "Email no configurado: se requieren SMTP_HOST, SMTP_PORT, EMAIL_FROM y EMAIL_TO.",
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    ...(smtpUser && smtpPass
      ? { auth: { user: smtpUser, pass: smtpPass } }
      : {}),
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  const total = countMovies(days);

  await transporter.sendMail({
    from: emailFrom,
    to: emailTo,
    subject: `🎬 Filmoteca - ${total} películas disponibles`,
    html: buildHtml(days),
  });

  console.log("  ✓ Email enviado a", emailTo);
}
