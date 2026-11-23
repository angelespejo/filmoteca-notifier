import { loadConfig } from "../config.js";
import { parseArgs } from "./args.js";
import { runAskMode } from "./commands/ask.js";
import { runManualMode } from "./commands/manual.js";
import { runServerMode } from "./commands/server.js";
import { getVersion, renderHelp } from "./help.js";

export async function runCli(argv: string[]): Promise<number> {
  const args = parseArgs(argv);

  if (args.help) {
    console.log(renderHelp(args.command === "help" ? args.helpCommand : args.command));
    return 0;
  }

  if (args.version) {
    console.log(getVersion());
    return 0;
  }

  if (args.error) {
    console.error(`Error: ${args.error}\n`);
    console.error(renderHelp(args.command === "help" ? args.helpCommand : args.command));
    return 2;
  }

  if (args.command === "help") {
    console.log(renderHelp(args.helpCommand));
    return 0;
  }

  const config = loadConfig();

  switch (args.command) {
    case "ask":
      await runAskMode(config, {
        res: args.res,
        noProgram: args.noProgram,
        print: args.print,
        notify: args.notify,
      });
      return 0;
    case "manual":
      await runManualMode(config, { res: args.res, noProgram: args.noProgram });
      return 0;
    case "server":
      await runServerMode(config, { res: args.res, noProgram: args.noProgram });
      return 0;
    case undefined:
      return 2;
  }
}
