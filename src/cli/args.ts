import {
  isOutputFormat,
  type OutputFormat,
} from "../output/index.js";

export const CLI_COMMANDS = ["server", "manual", "ask", "help"] as const;
export type CliCommand = (typeof CLI_COMMANDS)[number];

export interface CliArgs {
  command?: CliCommand;
  helpCommand?: CliCommand;
  res: OutputFormat;
  noProgram: boolean;
  print: boolean;
  notify: boolean;
  help: boolean;
  version: boolean;
  error?: string;
}

function isCliCommand(value: string): value is CliCommand {
  return (CLI_COMMANDS as readonly string[]).includes(value);
}

export function parseArgs(argv: string[]): CliArgs {
  let command: CliCommand | undefined;
  let helpCommand: CliCommand | undefined;
  let res: OutputFormat = "text";
  let noProgram = false;
  let print = false;
  let notify = false;
  let help = false;
  let version = false;
  let error: string | undefined;
  const positional: string[] = [];

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]!;

    switch (arg) {
      case "--help":
      case "-h":
        help = true;
        break;
      case "--version":
      case "-V":
        version = true;
        break;
      case "--no-program":
      case "--sin-programa":
        noProgram = true;
        break;
      case "--print":
        print = true;
        break;
      case "--notify":
        notify = true;
        break;
      case "--res": {
        const value = argv[++index];
        if (!value) {
          error ??= "Falta el valor de --res.";
        } else if (!isOutputFormat(value)) {
          error ??= `Formato de salida no válido: "${value}".`;
        } else {
          res = value;
        }
        break;
      }
      default:
        if (arg.startsWith("-")) {
          error ??= `Opción desconocida: ${arg}`;
        } else {
          positional.push(arg);
        }
    }
  }

  if (positional.length > 0) {
    const [first, second, ...rest] = positional;
    if (!isCliCommand(first!)) {
      error ??= `Subcomando desconocido: "${first}".`;
    } else {
      command = first;
      if (second !== undefined) {
        if (command !== "help") {
          error ??= `Argumento inesperado: "${second}".`;
        } else if (!isCliCommand(second)) {
          error ??= `Subcomando desconocido: "${second}".`;
        } else {
          helpCommand = second;
        }
      }
      if (rest.length > 0) {
        error ??= `Argumentos inesperados: ${rest.join(" ")}`;
      }
    }
  }

  if (!command && !help && !version) {
    error ??= "Falta el subcomando. Usa: server, manual, ask o help.";
  } else if (command && command !== "ask" && (print || notify)) {
    error ??= "--print y --notify solo están disponibles en el subcomando ask.";
  }

  return {
    command,
    helpCommand,
    res,
    noProgram,
    print,
    notify,
    help,
    version,
    error,
  };
}
