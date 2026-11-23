import assert from "node:assert/strict";
import test from "node:test";
import {
  formatScrapedDays,
  isOutputFormat,
  outputExtension,
} from "../src/output/index.js";
import type { ScrapedDay } from "../src/types.js";

const days: ScrapedDay[] = [
  {
    date: "24 Noviembre 2026",
    programUrl: "https://example.com/programa.pdf",
    movies: [
      {
        title: 'Película, "especial"',
        directors: ["Directora A", "Director B"],
        description: "Sinopsis",
        status: "available",
        buyUrl: "https://example.com/buy",
        infoUrl: "https://example.com/info",
        date: "2026-11-24",
        time: "17:30",
        category: "Ciclo",
      },
    ],
  },
];

test("output format helpers validate formats and extensions", () => {
  assert.equal(isOutputFormat("json"), true);
  assert.equal(isOutputFormat("jsonl"), false);
  assert.equal(outputExtension("text"), "txt");
  assert.equal(outputExtension("table"), "txt");
  assert.equal(outputExtension("markdown"), "md");
  assert.equal(outputExtension("csv"), "csv");
});

test("JSON output round-trips ScrapedDay[]", () => {
  const output = formatScrapedDays(days, "json");
  assert.deepEqual(JSON.parse(output), days);
  assert.ok(output.endsWith("\n"));
});

test("CSV output uses titled headers and escapes commas and quotes", () => {
  const output = formatScrapedDays(days, "csv");
  assert.ok(
    output.startsWith("Fecha,Hora,Título,Directores,Estado,Categoría,Info,Compra,Programa"),
  );
  assert.ok(output.includes('"Película, ""especial"""'));
  assert.ok(output.includes("Directora A, Director B"));
  assert.ok(output.includes("https://example.com/info"));
  assert.ok(output.includes("https://example.com/buy"));
  assert.ok(output.includes("https://example.com/programa.pdf"));
});

test("table, markdown and text contain the result and links", () => {
  const table = formatScrapedDays(days, "table");
  const markdown = formatScrapedDays(days, "markdown");
  const text = formatScrapedDays(days, "text");

  assert.match(table, /Día/);
  assert.match(table, /Info/);
  assert.match(table, /Compra/);
  assert.match(table, /Película, "especial"/);
  assert.match(table, /example\.com\/info/);
  assert.match(table, /example\.com\/buy/);
  assert.match(markdown, /## 📅 24 Noviembre 2026/);
  assert.match(markdown, /### 🎬 Película, "especial"/);
  assert.match(markdown, /- \*\*Hora:\*\* 17:30/);
  assert.match(markdown, /- \*\*Directores:\*\* Directora A, Director B/);
  assert.match(markdown, /\[📋 Programa del mes\]/);
  assert.match(markdown, /\[ℹ️ Más información\]\(https:\/\/example\.com\/info\)/);
  assert.match(markdown, /\[🔗 Comprar\]\(https:\/\/example\.com\/buy\)/);
  assert.doesNotMatch(markdown, /\| Hora \|/);
  assert.match(text, /FILMOTECA ESPAÑOLA/);
  assert.match(text, /Total: 1 películas en 1 días/);
});

test("--no-program removes the programme from every format", () => {
  const options = { includeProgram: false };
  const json = JSON.parse(formatScrapedDays(days, "json", options)) as Array<Record<string, unknown>>;
  const csv = formatScrapedDays(days, "csv", options);
  const markdown = formatScrapedDays(days, "markdown", options);
  const table = formatScrapedDays(days, "table", options);
  const text = formatScrapedDays(days, "text", options);

  assert.equal(json[0]?.programUrl, undefined);
  assert.ok(!csv.includes("Programa"));
  assert.ok(!markdown.includes("Programa del mes"));
  assert.ok(!table.includes("Programa:"));
  assert.ok(!text.includes("Programa del mes"));
  assert.ok(csv.includes("https://example.com/info"));
  assert.ok(csv.includes("https://example.com/buy"));
});
