import assert from "node:assert/strict";
import test from "node:test";
import { parseArgs } from "../src/cli/args.js";
import { getVersion, renderHelp } from "../src/cli/help.js";
import { runCli } from "../src/cli/run.js";

test("a subcommand is required", () => {
  const args = parseArgs([]);
  assert.match(args.error ?? "", /Falta el subcomando/);
});

test("parseArgs accepts subcommands and options", () => {
  assert.equal(parseArgs(["server"]).command, "server");
  assert.equal(parseArgs(["manual"]).command, "manual");
  assert.equal(parseArgs(["ask"]).command, "ask");
  assert.equal(parseArgs(["help"]).command, "help");

  const manual = parseArgs(["manual", "--res", "json"]);
  assert.equal(manual.command, "manual");
  assert.equal(manual.res, "json");
  assert.equal(manual.error, undefined);

  const ask = parseArgs(["ask", "--print", "--notify", "--res", "csv"]);
  assert.equal(ask.command, "ask");
  assert.equal(ask.print, true);
  assert.equal(ask.notify, true);
  assert.equal(ask.res, "csv");

  assert.equal(parseArgs(["manual", "--no-program"]).noProgram, true);
  assert.equal(parseArgs(["manual", "--sin-programa"]).noProgram, true);

  const help = parseArgs(["help", "manual"]);
  assert.equal(help.command, "help");
  assert.equal(help.helpCommand, "manual");

  assert.equal(parseArgs(["--help"]).help, true);
  assert.equal(parseArgs(["--version"]).version, true);
});

test("parseArgs rejects invalid combinations and formats", () => {
  assert.match(parseArgs(["firefox"]).error ?? "", /Subcomando desconocido/);
  assert.match(parseArgs(["server", "--print"]).error ?? "", /solo están disponibles/);
  assert.match(parseArgs(["manual", "--notify"]).error ?? "", /solo están disponibles/);
  assert.match(parseArgs(["manual", "--res"]).error ?? "", /Falta el valor/);
  assert.match(parseArgs(["manual", "--res", "jsonl"]).error ?? "", /no válido/);
  assert.match(parseArgs(["manual", "extra"]).error ?? "", /inesperado/);
  assert.match(parseArgs(["help", "firefox"]).error ?? "", /Subcomando desconocido/);
});

test("help includes funding, bugs and every subcommand", () => {
  const help = renderHelp();

  assert.match(help, /server/);
  assert.match(help, /manual/);
  assert.match(help, /ask/);
  assert.match(help, /--res/);
  assert.match(help, /--no-program/);
  assert.match(help, /DATA_DIR/);
  assert.match(help, /Funding:/);
  assert.match(help, /Bugs:/);
  assert.match(help, /github\.com\/sponsors\/angelespejo/);
  assert.match(help, /filmoteca-notifier\/issues/);
});

test("help and version do not require configuration", async (t) => {
  t.mock.method(console, "log", () => undefined);

  assert.equal(await runCli(["--help"]), 0);
  assert.equal(await runCli(["help", "manual"]), 0);
  assert.equal(await runCli(["--version"]), 0);
  assert.match(getVersion(), /^\d+\.\d+\.\d+/);
});

test("unknown commands and missing subcommands exit with code 2", async (t) => {
  t.mock.method(console, "log", () => undefined);
  t.mock.method(console, "error", () => undefined);

  assert.equal(await runCli([]), 2);
  assert.equal(await runCli(["unknown"]), 2);
  assert.equal(await runCli(["manual", "--res", "jsonl"]), 2);
});
