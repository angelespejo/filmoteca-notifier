import { isProgramHost, MAX_PDF_BYTES, SCRAPE_USER_AGENT } from "../scraping/constants.js";
import { readLimitedBody } from "../scraping/fetch.js";

const PDF_TIMEOUT_MS = 20_000;

export async function downloadPdf(url: string): Promise<Buffer> {
  const initial = new URL(url);
  if (!isProgramHost(initial.hostname)) {
    throw new Error(`Host no permitido para el PDF: ${initial.hostname}`);
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": SCRAPE_USER_AGENT,
      Accept: "application/pdf",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(PDF_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  if (response.url) {
    const finalUrl = new URL(response.url);
    if (!isProgramHost(finalUrl.hostname)) {
      throw new Error(`Redirección no permitida para el PDF: ${finalUrl.hostname}`);
    }
  }

  const buffer = await readLimitedBody(response, MAX_PDF_BYTES);
  if (buffer.byteLength === 0) throw new Error("PDF vacío");
  if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("La respuesta no parece un PDF");
  }

  return buffer;
}
