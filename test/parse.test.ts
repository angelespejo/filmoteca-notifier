import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeDescription,
  normalizeText,
  parseDirector,
  parseStatus,
  parseTime,
} from "../src/_shared/parse.js";

test("parseStatus normalizes the action text", () => {
  assert.equal(parseStatus("Agotado"), "sold_out");
  assert.equal(parseStatus("  COMPRAR "), "available");
  assert.equal(parseStatus("Próximamente"), "upcoming");
  assert.equal(parseStatus(""), "upcoming");
});

test("parseDirector splits names and removes empty entries", () => {
  assert.deepEqual(parseDirector("Jorge Acha, Roberto Gavaldón; Keisuke Kinoshita"), [
    "Jorge Acha",
    "Roberto Gavaldón",
    "Keisuke Kinoshita",
  ]);
  assert.deepEqual(parseDirector(""), []);
  assert.deepEqual(parseDirector(" , ; "), []);
});

test("parseTime extracts the first valid HH:MM value", () => {
  assert.equal(
    parseTime("Fecha y Hora: Miércoles 11 de noviembre a las 17:30h (Sala 1)"),
    "17:30",
  );
  assert.equal(parseTime("a las 9:05"), "09:05");
  assert.equal(parseTime("sin hora"), "");
  assert.equal(parseTime("25:00"), "");
  assert.equal(parseTime("17:60"), "");
});

test("normalizeText collapses whitespace", () => {
  assert.equal(normalizeText("  La   belle \n marinière  "), "La belle marinière");
});

test("normalizeDescription removes parser-dependent spaces before punctuation", () => {
  assert.equal(
    normalizeDescription("(Sala 1) *Aunque las entradas"),
    "(Sala 1)*Aunque las entradas",
  );
});
