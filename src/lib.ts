export { scrapeFilmoteca, type ScrapeOptions } from "./scraper.js";
export { loadConfig, emailEnabled, gotifyEnabled } from "./config.js";
export { notifyDays } from "./notifiers/dispatch.js";
export {
  runScrapeAndNotify,
  startScheduler,
  stopScheduler,
  type RunDependencies,
} from "./scheduler.js";
export {
  formatScrapedDays,
  writeScrapedDays,
  type FormatOptions,
  type OutputFormat,
  type WriteOptions,
} from "./output/index.js";
export { scrapeAndStore, type ScrapeAndStoreOptions } from "./pipeline.js";
export { saveScrapeResult, type SaveScrapeOptions, type StorageCommand } from "./storage/index.js";
export { printToConsole } from "./notifiers/console.js";
export { sendEmail } from "./notifiers/email.js";
export { sendGotify } from "./notifiers/gotify.js";
export { ask, askBool } from "./_shared/process.js";
export type { AppConfig, Movie, ScrapedDay } from "./types.js";
