export interface RawListing {
  fecha: string;
  category: string;
  title: string;
  director: string;
  description: string;
  actionText: string;
  buyUrl: string;
  infoUrl: string;
}

export interface ScrapeRuntimeOptions {
  /** Injectable clock for tests. */
  now?: Date;
  /** Number of days after tomorrow to include. Default: 3. */
  daysAhead?: number;
  /** Safety limit for pagination. Default: 50. */
  maxPages?: number;
  /** Resolve and return the monthly programme URL. Default: true. */
  includeProgram?: boolean;
}
