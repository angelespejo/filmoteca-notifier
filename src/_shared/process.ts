import { stdin, stdout } from "node:process";
import * as readline from "node:readline/promises";

export async function ask(query: string): Promise<string> {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    return await rl.question(query);
  } finally {
    rl.close();
  }
}

export async function askBool(q: string): Promise<boolean> {
  const answer = (await ask(q)).trim().toLowerCase();
  return ["y", "yes", "s", "si", "sí"].includes(answer);
}
