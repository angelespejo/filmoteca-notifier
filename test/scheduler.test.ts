import assert from "node:assert/strict";
import test from "node:test";
import {
  notifyDays,
  runScrapeAndNotify,
  startScheduler,
  stopScheduler,
} from "../src/scheduler.js";
import type { AppConfig, ScrapedDay } from "../src/types.js";

const DAYS: ScrapedDay[] = [
  {
    date: "12 Noviembre 2026",
    programUrl: "https://example.com/program",
    movies: [
      {
        title: "La belle marinière",
        directors: ["Directora"],
        description: "",
        status: "available",
        buyUrl: "https://example.com/buy",
        infoUrl: undefined,
        date: "2026-11-12",
        time: "17:30",
        category: "Ciclo",
      },
    ],
  },
];

function config(): AppConfig {
  return {
    cron: "0 0 * * *",
    cronTimezone: "Europe/Madrid",
    smtpHost: "localhost",
    smtpPort: 1025,
    smtpUser: undefined,
    smtpPass: undefined,
    emailFrom: "from@example.com",
    emailTo: "to@example.com",
    gotifyUrl: "http://gotify",
    gotifyToken: "token",
  };
}

test("notifyDays keeps sending to the other channels when one fails", async (t) => {
  t.mock.method(console, "error", () => undefined);
  let gotifyCalls = 0;

  await assert.rejects(
    () =>
      notifyDays(DAYS, config(), {
        email: async () => {
          throw new Error("SMTP caído");
        },
        gotify: async () => {
          gotifyCalls++;
        },
      }),
    (error) => error instanceof AggregateError && /email/.test(error.message),
  );

  assert.equal(gotifyCalls, 1);
});

test("notifyDays resolves when every channel succeeds", async () => {
  let emailCalls = 0;
  let gotifyCalls = 0;

  await notifyDays(DAYS, config(), {
    email: async () => {
      emailCalls++;
    },
    gotify: async () => {
      gotifyCalls++;
    },
  });

  assert.equal(emailCalls, 1);
  assert.equal(gotifyCalls, 1);
});

test("startScheduler validates the cron expression and can be stopped", async (t) => {
  t.mock.method(console, "log", () => undefined);

  assert.throws(() => startScheduler({ ...config(), cron: "not a cron" }), /CRON/);

  startScheduler(config());
  await stopScheduler();
});

test("runScrapeAndNotify uses injected dependencies and keeps the same contract", async (t) => {
  t.mock.method(console, "log", () => undefined);
  let printed = 0;
  let scraped = 0;

  await runScrapeAndNotify(config(), {
    scrape: async () => {
      scraped++;
      return DAYS;
    },
    print: () => {
      printed++;
    },
    email: async () => undefined,
    gotify: async () => undefined,
  });

  assert.equal(scraped, 1);
  assert.equal(printed, 1);
});
