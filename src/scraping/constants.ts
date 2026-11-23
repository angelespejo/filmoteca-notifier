export const BASE_URL = "https://entradasfilmoteca.sacatuentrada.es/es";
export const PROGRAM_PAGE_URL =
  "https://www.cultura.gob.es/cultura/areas/cine/mc/fe/programacion-actividades/proyecciones.html";
export const DEFAULT_DAYS_AHEAD = 3;
export const DEFAULT_MAX_PAGES = 50;

export const SCRAPE_USER_AGENT =
  "filmoteca-notifier/1.0 (+https://github.com/angelespejo/filmoteca-notifier)";

export const MAX_HTML_BYTES = 5 * 1024 * 1024;
export const MAX_PDF_BYTES = 25 * 1024 * 1024;

export function isListingUrl(url: URL): boolean {
  return url.origin === new URL(BASE_URL).origin;
}

export function isProgramHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "cultura.gob.es" || host.endsWith(".cultura.gob.es");
}
