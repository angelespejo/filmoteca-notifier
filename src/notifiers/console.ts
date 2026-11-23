import { stdout } from "node:process";
import type { ScrapedDay } from "../types.js";
import { writeScrapedDays } from "../output/index.js";

/** Human-readable console output, also used by the server when --res=text. */
export function printToConsole(days: ScrapedDay[]): void {
  writeScrapedDays(days, "text", { stream: stdout });
}
