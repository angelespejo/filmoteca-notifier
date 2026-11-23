import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  parseListingHtml,
  parseNextPageUrl,
  parseProgramUrl,
} from "../src/scraping/parser.js";
import { readLimitedBody } from "../src/scraping/fetch.js";
import { buildScrapedDays } from "../src/scraping/transform.js";

const listingHtml = readFileSync(new URL("./fixtures/listing.html", import.meta.url), "utf8");
const programHtml = readFileSync(new URL("./fixtures/program.html", import.meta.url), "utf8");

test("parseListingHtml extracts the expected fields", () => {
  const listings = parseListingHtml(listingHtml);

  assert.equal(listings.length, 3);
  assert.deepEqual(listings[0], {
    fecha: "2026-11-23",
    category: "Ciclo de prueba",
    title: "Película A",
    director: "Directora A",
    description: "Fecha y Hora: Lunes 23 de noviembre a las 17:30h (Sala 1)",
    actionText: "Comprar",
    buyUrl: "https://example.com/a-buy",
    infoUrl: "https://example.com/a-info",
  });
  assert.equal(listings[1]?.actionText, "Agotado");
  assert.equal(listings[2]?.actionText, "Próximamente");
});

test("parseNextPageUrl resolves the next pagination link", () => {
  assert.equal(
    parseNextPageUrl(listingHtml, 1),
    "https://entradasfilmoteca.sacatuentrada.es/es/busqueda?&pagina=2",
  );
  assert.equal(parseNextPageUrl(listingHtml, 3), null);
});

test("parseNextPageUrl rejects external hosts", () => {
  const html = `
    <ul class="pagination">
      <li><a href="https://evil.example/pagina=2">2</a></li>
    </ul>
  `;
  assert.equal(parseNextPageUrl(html, 1), null);
});

test("parseProgramUrl rejects external PDFs", () => {
  const html = '<a href="https://evil.example/programa.pdf">programa</a>';
  assert.equal(parseProgramUrl(html), "https://www.cultura.gob.es/cultura/areas/cine/mc/fe/programacion-actividades/proyecciones.html");
});

test("readLimitedBody enforces the maximum response size", async () => {
  const response = new Response("x".repeat(100), {
    headers: { "content-length": "100" },
  });

  await assert.rejects(() => readLimitedBody(response, 10), /demasiado grande/);
});

test("parseProgramUrl prefers the programme PDF", () => {
  assert.equal(
    parseProgramUrl(programHtml),
    "https://www.cultura.gob.es/dam/jcr:def/programa-noviembre.pdf",
  );
});

test("buildScrapedDays filters by Madrid calendar and formats the day", () => {
  const days = buildScrapedDays(
    parseListingHtml(listingHtml),
    "https://example.com/programa.pdf",
    { now: new Date("2026-11-22T12:00:00Z") },
  );

  assert.equal(days.length, 3);
  assert.equal(days[0]?.date, "23 Noviembre 2026");
  assert.equal(days[0]?.movies[0]?.time, "17:30");
  assert.equal(days[0]?.movies[0]?.directors[0], "Directora A");
  assert.equal(days[1]?.date, "24 Noviembre 2026");
  assert.equal(days[2]?.date, "25 Noviembre 2026");
});

test("buildScrapedDays removes duplicated listings", () => {
  const listings = parseListingHtml(listingHtml);
  const days = buildScrapedDays([...listings, ...listings], "https://example.com/programa.pdf", {
    now: new Date("2026-11-22T12:00:00Z"),
  });

  assert.equal(days.reduce((total, day) => total + day.movies.length, 0), 3);
});
