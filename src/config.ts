import { env } from "node:process";
import type { AppConfig } from "./types.js";

export type { AppConfig };

const DEFAULT_CRON = "0 0 * * *";
const DEFAULT_CRON_TIMEZONE = "Europe/Madrid";

function parsePort(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    console.warn(`[config] SMTP_PORT no válido: "${value}". Email desactivado.`);
    return undefined;
  }

  return port;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === "") return fallback;

  return /^(1|true|yes|y|si|sí|on)$/i.test(value.trim());
}

function parseTimezone(value: string | undefined): string {
  const timezone = value?.trim() || DEFAULT_CRON_TIMEZONE;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    console.warn(
      `[config] CRON_TIMEZONE no válida: "${value}". Usando ${DEFAULT_CRON_TIMEZONE}.`,
    );
    return DEFAULT_CRON_TIMEZONE;
  }
}

export function loadConfig(): AppConfig {
  return {
    cron: env["CRON"]?.trim() || DEFAULT_CRON,
    cronTimezone: parseTimezone(env["CRON_TIMEZONE"]),
    runOnStart: parseBoolean(env["RUN_ON_START"], true),
    dataDir: env["DATA_DIR"]?.trim() || undefined,
    smtpHost: env["SMTP_HOST"],
    smtpPort: parsePort(env["SMTP_PORT"]),
    smtpUser: env["SMTP_USER"],
    smtpPass: env["SMTP_PASS"],
    emailFrom: env["EMAIL_FROM"] || env["SMTP_USER"],
    emailTo: env["EMAIL_TO"],
    gotifyUrl: env["GOTIFY_URL"],
    gotifyToken: env["GOTIFY_TOKEN"],
  };
}

/**
 * Email is enabled with a host, a port, a sender and a recipient.
 * Authentication is optional so local relays (Mailpit, Postfix) work too.
 */
export function emailEnabled(config: AppConfig): boolean {
  return !!(
    config.smtpHost &&
    config.smtpPort &&
    config.emailFrom &&
    config.emailTo
  );
}

export function gotifyEnabled(config: AppConfig): boolean {
  return !!(config.gotifyUrl && config.gotifyToken);
}
