import { readFileSync } from "node:fs";
import type { CliCommand } from "./args.js";

interface PackageInfo {
  version: string;
  funding?: string;
  bugs?: string;
}

let cachedPackage: PackageInfo | undefined;

function fundingUrl(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const url = fundingUrl(entry);
      if (url) return url;
    }
    return undefined;
  }
  if (value && typeof value === "object" && "url" in value) {
    const url = (value as { url?: unknown }).url;
    return typeof url === "string" ? url : undefined;
  }
  return undefined;
}

function bugsUrl(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "url" in value) {
    const url = (value as { url?: unknown }).url;
    return typeof url === "string" ? url : undefined;
  }
  return undefined;
}

function packageInfo(): PackageInfo {
  if (cachedPackage) return cachedPackage;

  try {
    const raw = readFileSync(new URL("../../package.json", import.meta.url), "utf8");
    const parsed = JSON.parse(raw) as {
      version?: unknown;
      funding?: unknown;
      bugs?: unknown;
    };
    cachedPackage = {
      version: typeof parsed.version === "string" ? parsed.version : "unknown",
      funding: fundingUrl(parsed.funding),
      bugs: bugsUrl(parsed.bugs),
    };
  } catch {
    cachedPackage = { version: "unknown" };
  }

  return cachedPackage;
}

export function getVersion(): string {
  return packageInfo().version;
}

function renderFooter(): string {
  const info = packageInfo();
  const lines: string[] = [];

  if (info.funding) {
    lines.push("Funding:", `  ${info.funding}`);
  }
  if (info.bugs) {
    if (lines.length > 0) lines.push("");
    lines.push("Bugs:", `  ${info.bugs}`);
  }

  return lines.join("\n");
}

function renderEnvironment(): string {
  return `Variables de entorno:
  CRON             Expresión cron. Por defecto: 0 0 * * *
  CRON_TIMEZONE    Zona horaria del cron. Por defecto: Europe/Madrid
  RUN_ON_START     Scrape inicial al arrancar. Por defecto: true
  DATA_DIR         Carpeta opcional para guardar resultados y PDF

  SMTP_HOST        Servidor SMTP
  SMTP_PORT        Puerto SMTP (587 STARTTLS, 465 SSL)
  SMTP_USER        Usuario SMTP (opcional en relays locales)
  SMTP_PASS        Contraseña SMTP (opcional en relays locales)
  EMAIL_FROM       Remitente
  EMAIL_TO         Destinatarios separados por comas

  GOTIFY_URL       URL de Gotify
  GOTIFY_TOKEN     Token de Gotify`;
}

function renderResOptions(): string {
  return `Opciones de salida:
  --res <formato>  text | json | table | markdown | csv (por defecto: text)
  --no-program     Omite el programa del output y no descarga el PDF
                   (alias: --sin-programa)`;
}

function withFooter(body: string): string {
  const footer = renderFooter();
  return footer ? `${body}\n\n${footer}` : body;
}

export function renderHelp(command?: CliCommand): string {
  if (command === "server") {
    return withFooter(`Uso: filmoteca-notifier server [opciones]

Arranca el daemon con cron y notificaciones.

${renderResOptions()}

Opciones generales:
  -h, --help       Muestra esta ayuda
  -V, --version    Muestra la versión

${renderEnvironment()}`);
  }

  if (command === "manual") {
    return withFooter(`Uso: filmoteca-notifier manual [opciones]

Scrapea y muestra el resultado, sin enviar notificaciones.

${renderResOptions()}

Opciones generales:
  -h, --help       Muestra esta ayuda
  -V, --version    Muestra la versión

${renderEnvironment()}`);
  }

  if (command === "ask") {
    return withFooter(`Uso: filmoteca-notifier ask [opciones]

Scrapea preguntando si quieres imprimir el resultado y/o notificar.

${renderResOptions()}
  --print          Imprime el resultado sin preguntar
  --notify         Envía notificaciones sin preguntar

Opciones generales:
  -h, --help       Muestra esta ayuda
  -V, --version    Muestra la versión

${renderEnvironment()}`);
  }

  if (command === "help") {
    return withFooter(`Uso: filmoteca-notifier help [server|manual|ask]

Muestra la ayuda general o la de un subcomando.`);
  }

  return withFooter(`Filmoteca Notifier ${getVersion()}

Uso: filmoteca-notifier <comando> [opciones]

Subcomandos:
  server           Daemon con cron y notificaciones
  manual           Scrapea y muestra el resultado, sin notificaciones
  ask              Scrapea preguntando si imprimir y si notificar

Opciones generales:
  -h, --help       Muestra esta ayuda
  -V, --version    Muestra la versión

${renderResOptions()}

${renderEnvironment()}

Ejemplos:
  filmoteca-notifier server
  filmoteca-notifier manual --res json
  filmoteca-notifier ask --print --res table
  filmoteca-notifier ask --notify
  filmoteca-notifier help manual
  DATA_DIR=./data filmoteca-notifier manual`);
}
