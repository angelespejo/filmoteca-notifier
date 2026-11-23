import assert from "node:assert/strict";
import test from "node:test";
import { emailEnabled, gotifyEnabled, loadConfig } from "../src/config.js";
import type { AppConfig } from "../src/types.js";

const ENV_KEYS = [
  "CRON",
  "CRON_TIMEZONE",
  "RUN_ON_START",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
  "EMAIL_TO",
  "GOTIFY_URL",
  "GOTIFY_TOKEN",
] as const;

function withEnv(
  overrides: Partial<Record<(typeof ENV_KEYS)[number], string>>,
  run: () => void,
): void {
  const saved = new Map<string, string | undefined>();
  for (const key of ENV_KEYS) {
    saved.set(key, process.env[key]);
    delete process.env[key];
  }
  Object.assign(process.env, overrides);

  try {
    run();
  } finally {
    for (const key of ENV_KEYS) {
      const value = saved.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function config(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    cron: "0 0 * * *",
    cronTimezone: "Europe/Madrid",
    smtpHost: undefined,
    smtpPort: undefined,
    smtpUser: undefined,
    smtpPass: undefined,
    emailFrom: undefined,
    emailTo: undefined,
    gotifyUrl: undefined,
    gotifyToken: undefined,
    ...overrides,
  };
}

test("loadConfig uses safe defaults and parses RUN_ON_START", () => {
  withEnv({}, () => {
    const loaded = loadConfig();
    assert.equal(loaded.cron, "0 0 * * *");
    assert.equal(loaded.cronTimezone, "Europe/Madrid");
    assert.equal(loaded.runOnStart, true);
  });

  withEnv({ RUN_ON_START: "false" }, () => {
    assert.equal(loadConfig().runOnStart, false);
  });

  withEnv({ RUN_ON_START: "sí" }, () => {
    assert.equal(loadConfig().runOnStart, true);
  });
});

test("loadConfig parses CRON_TIMEZONE and falls back for invalid values", (t) => {
  t.mock.method(console, "warn", () => undefined);

  withEnv({ CRON_TIMEZONE: "America/New_York" }, () => {
    assert.equal(loadConfig().cronTimezone, "America/New_York");
  });

  withEnv({ CRON_TIMEZONE: "Invalid/Timezone" }, () => {
    assert.equal(loadConfig().cronTimezone, "Europe/Madrid");
  });
});

test("loadConfig ignores an invalid SMTP port", (t) => {
  t.mock.method(console, "warn", () => undefined);

  withEnv({ SMTP_PORT: "not-a-port" }, () => {
    assert.equal(loadConfig().smtpPort, undefined);
  });

  withEnv({ SMTP_PORT: "587" }, () => {
    assert.equal(loadConfig().smtpPort, 587);
  });
});

test("emailEnabled only needs host, port, sender and recipient", () => {
  const base = {
    smtpHost: "localhost",
    smtpPort: 1025,
    emailFrom: "from@example.com",
    emailTo: "to@example.com",
  };

  assert.equal(emailEnabled(config(base)), true);
  assert.equal(emailEnabled(config({ ...base, smtpUser: "user", smtpPass: "pass" })), true);
  assert.equal(emailEnabled(config({ ...base, smtpHost: undefined })), false);
  assert.equal(emailEnabled(config({ ...base, emailTo: undefined })), false);
  assert.equal(emailEnabled(config({ ...base, smtpPort: undefined })), false);
});

test("gotifyEnabled requires URL and token", () => {
  assert.equal(gotifyEnabled(config({ gotifyUrl: "http://gotify", gotifyToken: "token" })), true);
  assert.equal(gotifyEnabled(config({ gotifyUrl: "http://gotify" })), false);
  assert.equal(gotifyEnabled(config({ gotifyToken: "token" })), false);
});
