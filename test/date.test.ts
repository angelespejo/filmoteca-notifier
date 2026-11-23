import assert from "node:assert/strict";
import test from "node:test";
import {
  addDays,
  compareDates,
  formatSpanishDate,
  parseIsoDate,
  todayInMadrid,
  toIsoDate,
} from "../src/_shared/date.js";

test("parseIsoDate accepts real calendar dates", () => {
  assert.deepEqual(parseIsoDate("2026-11-12"), { year: 2026, month: 11, day: 12 });
  assert.deepEqual(parseIsoDate("2024-02-29"), { year: 2024, month: 2, day: 29 });
});

test("parseIsoDate rejects malformed or impossible dates", () => {
  assert.equal(parseIsoDate("2026-02-30"), null);
  assert.equal(parseIsoDate("2026-13-01"), null);
  assert.equal(parseIsoDate("2026-00-10"), null);
  assert.equal(parseIsoDate("2026-2-3"), null);
  assert.equal(parseIsoDate("12/11/2026"), null);
  assert.equal(parseIsoDate(""), null);
});

test("date arithmetic crosses month and year boundaries", () => {
  assert.deepEqual(addDays({ year: 2026, month: 11, day: 30 }, 1), {
    year: 2026,
    month: 12,
    day: 1,
  });
  assert.deepEqual(addDays({ year: 2026, month: 12, day: 31 }, 1), {
    year: 2027,
    month: 1,
    day: 1,
  });
  assert.equal(toIsoDate({ year: 2026, month: 1, day: 5 }), "2026-01-05");
});

test("todayInMadrid uses the Madrid calendar day", () => {
  // 23:30 UTC in November is 00:30 in Madrid (CET).
  assert.deepEqual(todayInMadrid(new Date("2026-11-11T23:30:00Z")), {
    year: 2026,
    month: 11,
    day: 12,
  });

  // 22:30 UTC in July is 00:30 in Madrid (CEST).
  assert.deepEqual(todayInMadrid(new Date("2026-07-01T22:30:00Z")), {
    year: 2026,
    month: 7,
    day: 2,
  });
});

test("formatSpanishDate and compareDates", () => {
  assert.equal(formatSpanishDate({ year: 2026, month: 11, day: 12 }), "12 Noviembre 2026");
  assert.ok(
    compareDates({ year: 2026, month: 11, day: 12 }, { year: 2026, month: 11, day: 13 }) < 0,
  );
  assert.equal(
    compareDates({ year: 2026, month: 11, day: 12 }, { year: 2026, month: 11, day: 12 }),
    0,
  );
});
