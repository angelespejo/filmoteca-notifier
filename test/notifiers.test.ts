import assert from "node:assert/strict";
import test from "node:test";
import { buildHtml, sendEmail } from "../src/notifiers/email.js";
import { buildMessage, sendGotify } from "../src/notifiers/gotify.js";
import type { AppConfig } from "../src/types.js";
import type { ScrapedDay } from "../src/types.js";

function days(): ScrapedDay[] {
  return [
    {
      date: "12 Noviembre 2026",
      programUrl: "javascript:alert('program')",
      movies: [
        {
          title: '<script>alert("xss")</script>',
          directors: ["Ana <Directora>"],
          description: '"><img src=x onerror=alert(1)>',
          status: "available",
          buyUrl: "javascript:alert('buy')",
          infoUrl: "https://example.com/info",
          date: "2026-11-12",
          time: "17:30",
          category: "Ciclo <especial>",
        },
      ],
    },
  ];
}

test("buildHtml escapes scraped content and blocks unsafe URLs", () => {
  const html = buildHtml(days());

  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("javascript:"));
  assert.ok(!html.includes("<img src=x"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("Ciclo &lt;especial&gt;"));
  assert.ok(html.includes("https://example.com/info"));
});

test("buildMessage normalizes multiline titles", () => {
  const message = buildMessage([
    {
      date: "12 Noviembre 2026",
      programUrl: "https://example.com/program",
      movies: [
        {
          title: "Título\ncon salto",
          directors: ["Directora"],
          description: "",
          status: "sold_out",
          buyUrl: undefined,
          infoUrl: "javascript:alert(1)",
          date: "2026-11-12",
          time: "",
          category: "Ciclo",
        },
      ],
    },
  ]);

  assert.ok(message.includes("Título con salto"));
  assert.ok(!message.includes("javascript:"));
});

test("sendEmail and sendGotify fail with a clear error when unconfigured", async () => {
  const empty = {} as AppConfig;
  await assert.rejects(() => sendEmail(days(), empty), /Email no configurado/);
  await assert.rejects(() => sendGotify(days(), empty), /Gotify no configurado/);
});
