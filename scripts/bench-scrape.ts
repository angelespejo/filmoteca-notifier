import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { scrapeFilmoteca } from "../src/scraper.js";

const startedAt = performance.now();
const days = await scrapeFilmoteca();
const elapsedMs = Math.round(performance.now() - startedAt);
const movies = days.reduce((total, day) => total + day.movies.length, 0);
const hash = createHash("sha256").update(JSON.stringify(days)).digest("hex").slice(0, 16);
const usage = process.resourceUsage();

console.log(
  JSON.stringify({
    elapsedMs,
    days: days.length,
    movies,
    hash,
    rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    maxRssMb: Math.round(usage.maxRSS / 1024),
    userCpuMs: Math.round(usage.userCPUTime / 1000),
    systemCpuMs: Math.round(usage.systemCPUTime / 1000),
  }),
);
