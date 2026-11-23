import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { type TestContext } from "node:test";
import { downloadPdf } from "../src/storage/pdf.js";
import { saveScrapeResult } from "../src/storage/index.js";
import type { AppConfig, ScrapedDay } from "../src/types.js";

const NOW = new Date("2026-11-24T08:00:00.000Z");
const STAMP = "2026-11-24T08-00-00-000Z";

const days: ScrapedDay[] = [
  {
    date: "24 Noviembre 2026",
    programUrl: "https://example.com/programa",
    movies: [
      {
        title: "Película A",
        directors: ["Directora A"],
        description: "",
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

function config(dataDir: string | undefined): AppConfig {
  return {
    cron: "0 0 * * *",
    cronTimezone: "Europe/Madrid",
    runOnStart: true,
    dataDir,
    smtpHost: undefined,
    smtpPort: undefined,
    smtpUser: undefined,
    smtpPass: undefined,
    emailFrom: undefined,
    emailTo: undefined,
    gotifyUrl: undefined,
    gotifyToken: undefined,
  };
}

async function tempDir(t: TestContext): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "filmoteca-storage-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

test("storage is disabled when DATA_DIR is absent", async () => {
  assert.equal(
    await saveScrapeResult(days, config(undefined), { command: "manual", format: "json", now: NOW }),
    undefined,
  );
});

test("saves formatted info under DATA_DIR/{command}", async (t) => {
  const dataDir = await tempDir(t);
  const saved = await saveScrapeResult(days, config(dataDir), {
    command: "manual",
    format: "json",
    now: NOW,
  });

  assert.ok(saved);
  assert.equal(saved.infoPath, join(dataDir, "manual", `${STAMP}-info.json`));
  assert.equal(saved.pdfPath, undefined);

  const content = JSON.parse(await readFile(saved.infoPath, "utf8"));
  assert.deepEqual(content, days);
});

test("downloads the program PDF and uses the same timestamp", async (t) => {
  const dataDir = await tempDir(t);
  const pdf = Buffer.from("%PDF-1.7\nfake pdf\n");
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response(pdf, { status: 200, headers: { "Content-Type": "application/pdf" } }),
  );

  const programUrl = "https://www.cultura.gob.es/programa.pdf";
  const result = await saveScrapeResult(
    [{ ...days[0]!, programUrl }],
    config(dataDir),
    { command: "server", format: "csv", now: NOW },
  );

  assert.ok(result?.pdfPath);
  assert.equal(result.pdfPath, join(dataDir, "server", `${STAMP}-programa.pdf`));
  assert.deepEqual(await readFile(result.pdfPath), pdf);
  assert.ok((await readFile(result.infoPath, "utf8")).startsWith("Fecha,Hora,Título"));
});

test("--no-program skips the PDF and the programme column", async (t) => {
  const dataDir = await tempDir(t);
  const result = await saveScrapeResult(
    [{ ...days[0]!, programUrl: "https://example.com/programa.pdf" }],
    config(dataDir),
    { command: "manual", format: "csv", includeProgram: false, now: NOW },
  );

  assert.ok(result?.infoPath);
  assert.equal(result.pdfPath, undefined);
  const content = await readFile(result.infoPath, "utf8");
  assert.ok(!content.includes("Programa"));
  assert.ok(content.includes("Info"));
  assert.ok(content.includes("Compra"));
});

test("saves a -programa.pdf for every output format", async (t) => {
  const dataDir = await tempDir(t);
  const pdf = Buffer.from("%PDF-1.7\nfake pdf\n");
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response(pdf, { status: 200, headers: { "Content-Type": "application/pdf" } }),
  );

  const programUrl = "https://www.cultura.gob.es/programa.pdf";
  const formats = ["text", "json", "table", "markdown", "csv"] as const;

  for (const [index, format] of formats.entries()) {
    const now = new Date(NOW.getTime() + index * 1000);
    const result = await saveScrapeResult(
      [{ ...days[0]!, programUrl }],
      config(dataDir),
      { command: "server", format, now },
    );

    assert.ok(result?.pdfPath?.endsWith("-programa.pdf"), format);
    assert.deepEqual(await readFile(result!.pdfPath!), pdf, format);
  }
});

test("rejects PDF downloads outside the allowed programme hosts", async () => {
  await assert.rejects(
    () => downloadPdf("http://127.0.0.1/programa.pdf"),
    /Host no permitido/,
  );
});

test("does not overwrite two runs with the same timestamp", async (t) => {
  const dataDir = await tempDir(t);
  await saveScrapeResult(days, config(dataDir), { command: "ask", format: "text", now: NOW });
  await saveScrapeResult(days, config(dataDir), { command: "ask", format: "text", now: NOW });

  const files = await readdir(join(dataDir, "ask"));
  assert.deepEqual(files.sort(), [
    `${STAMP}-1-info.txt`,
    `${STAMP}-info.txt`,
  ]);
});

test("a PDF download failure is non-fatal", async (t) => {
  const warn = t.mock.method(console, "warn", () => undefined);
  const dataDir = await tempDir(t);
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("network down");
  });

  const result = await saveScrapeResult(
    [{ ...days[0]!, programUrl: "https://www.cultura.gob.es/no-such.pdf" }],
    config(dataDir),
    { command: "manual", format: "json", now: NOW },
  );

  assert.ok(result?.infoPath);
  assert.equal(result?.pdfPath, undefined);
  assert.ok(warn.mock.callCount() > 0);
});
