import { stdout } from "node:process";
import type { ScrapedDay } from "../types.js";
import { renderCsv } from "./csv.js";
import { renderMarkdown } from "./markdown.js";
import { renderTable } from "./table.js";
import { renderText } from "./text.js";
import type { OutputFormat } from "./types.js";

export {
  isOutputFormat,
  OUTPUT_FORMATS,
  outputExtension,
  type OutputFormat,
} from "./types.js";

export interface FormatOptions {
  color?: boolean;
  includeProgram?: boolean;
}

export interface WriteOptions extends FormatOptions {
  stream?: NodeJS.WriteStream;
}

export function formatScrapedDays(
  days: ScrapedDay[],
  format: OutputFormat,
  options: FormatOptions = {},
): string {
  const includeProgram = options.includeProgram ?? true;

  switch (format) {
    case "json": {
      const data = includeProgram
        ? days
        : days.map(({ programUrl: _programUrl, ...day }) => day);
      return `${JSON.stringify(data, null, 2)}\n`;
    }
    case "csv":
      return renderCsv(days, includeProgram);
    case "markdown":
      return renderMarkdown(days, includeProgram);
    case "table":
      return `${renderTable(days, includeProgram)}\n`;
    case "text":
      return `${renderText(days, { color: options.color, includeProgram })}\n`;
  }
}

export function writeScrapedDays(
  days: ScrapedDay[],
  format: OutputFormat,
  options: WriteOptions = {},
): void {
  const stream = options.stream ?? stdout;
  stream.write(
    formatScrapedDays(days, format, {
      color: format === "text" && stream.isTTY,
      includeProgram: options.includeProgram,
    }),
  );
}
