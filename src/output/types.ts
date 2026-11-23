export const OUTPUT_FORMATS = ["text", "json", "table", "markdown", "csv"] as const;

export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export function isOutputFormat(value: string): value is OutputFormat {
  return (OUTPUT_FORMATS as readonly string[]).includes(value);
}

export function outputExtension(format: OutputFormat): string {
  switch (format) {
    case "json":
      return "json";
    case "csv":
      return "csv";
    case "markdown":
      return "md";
    case "text":
    case "table":
      return "txt";
  }
}
