import { emailEnabled, gotifyEnabled } from "../config.js";
import type { AppConfig, ScrapedDay } from "../types.js";
import { sendEmail } from "./email.js";
import { sendGotify } from "./gotify.js";

export interface NotificationDependencies {
  email?: typeof sendEmail;
  gotify?: typeof sendGotify;
  /** Suppress informational messages for structured output modes. */
  quiet?: boolean;
}

export async function notifyDays(
  days: ScrapedDay[],
  config: AppConfig,
  dependencies: NotificationDependencies = {},
): Promise<void> {
  const email = dependencies.email ?? sendEmail;
  const gotify = dependencies.gotify ?? sendGotify;

  const channels: Array<{ name: string; run: () => Promise<void> }> = [];
  if (emailEnabled(config)) {
    channels.push({ name: "email", run: () => email(days, config) });
  }
  if (gotifyEnabled(config)) {
    channels.push({ name: "gotify", run: () => gotify(days, config) });
  }

  if (channels.length === 0) {
    if (!dependencies.quiet) {
      console.log("  No hay notificaciones configuradas (SMTP / Gotify)");
    }
    return;
  }

  const results = await Promise.allSettled(channels.map((channel) => channel.run()));
  const failures = results.flatMap((result, index) =>
    result.status === "rejected"
      ? [{ name: channels[index]!.name, reason: result.reason }]
      : [],
  );

  for (const failure of failures) {
    console.error(`  ✖ Error enviando ${failure.name}:`, failure.reason);
  }

  if (failures.length > 0) {
    throw new AggregateError(
      failures.map((failure) => failure.reason),
      `Fallaron ${failures.length} canal(es): ${failures.map((failure) => failure.name).join(", ")}`,
    );
  }
}
