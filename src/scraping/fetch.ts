import { MAX_HTML_BYTES, SCRAPE_USER_AGENT } from "./constants.js";

const REQUEST_TIMEOUT_MS = 15_000;
const REQUEST_RETRIES = 1;
const SCRAPE_DEADLINE_MS = 120_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createScrapeDeadline(): number {
  return Date.now() + SCRAPE_DEADLINE_MS;
}

export async function readLimitedBody(
  response: Response,
  maxBytes: number,
): Promise<Buffer> {
  const contentLength = Number(response.headers.get("content-length") ?? "");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error(`Respuesta demasiado grande (${contentLength} bytes)`);
  }

  if (!response.body) {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > maxBytes) throw new Error("Respuesta demasiado grande");
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new Error("Respuesta demasiado grande");
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks);
}

export async function fetchHtml(url: string, deadline: number): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= REQUEST_RETRIES; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw new Error(`No se pudo descargar ${url}: tiempo máximo de scraping agotado`);
    }

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": SCRAPE_USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "es-ES,es;q=0.9",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(Math.min(REQUEST_TIMEOUT_MS, remaining)),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      return (await readLimitedBody(response, MAX_HTML_BYTES)).toString("utf8");
    } catch (error) {
      lastError = error;
      if (attempt < REQUEST_RETRIES && deadline - Date.now() > 0) {
        await delay(300 * (attempt + 1));
      }
    }
  }

  const reason = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`No se pudo descargar ${url}: ${reason}`);
}
