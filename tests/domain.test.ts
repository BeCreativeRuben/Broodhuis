import assert from "node:assert/strict";
import test from "node:test";

import {
  allergenSummary,
  parseAllergens,
  serialiseAllergens,
} from "../src/lib/allergens";
import {
  centsToDecimalString,
  centsToEuroInput,
  formatEuro,
  parseEuroInputToCents,
} from "../src/lib/money";
import { deliversToPostalCode, findWindow } from "../src/lib/shop-config";
import { parseClosedDatesInput } from "../src/lib/closed-dates";
import { slugify } from "../src/lib/validation";

test("bedragen worden in Belgisch formaat getoond", () => {
  assert.equal(formatEuro(290), "€ 2,90");
  assert.equal(formatEuro(3200), "€ 32,00");
  assert.equal(formatEuro(0), "€ 0,00");
});

test("prijsinvoer van de bakker wordt tolerant gelezen", () => {
  assert.equal(parseEuroInputToCents("3,50"), 350);
  assert.equal(parseEuroInputToCents("3.50"), 350);
  assert.equal(parseEuroInputToCents(" € 12 "), 1200);
  assert.equal(parseEuroInputToCents("0,05"), 5);
  assert.equal(parseEuroInputToCents(""), null);
  assert.equal(parseEuroInputToCents("gratis"), null);
  assert.equal(parseEuroInputToCents("3,505"), null);
});

test("centen gaan zonder afrondingsfouten naar de betaalprovider", () => {
  assert.equal(centsToDecimalString(350), "3.50");
  assert.equal(centsToDecimalString(3200), "32.00");
  assert.equal(centsToDecimalString(1), "0.01");
  assert.equal(centsToEuroInput(1850), "18,50");
});

test("allergenen worden in de wettelijke volgorde bewaard", () => {
  assert.deepEqual(parseAllergens("melk,gluten"), ["gluten", "melk"]);
  assert.deepEqual(parseAllergens("gluten, MELK , onzin"), ["gluten", "melk"]);
  assert.deepEqual(parseAllergens(""), []);
  assert.deepEqual(parseAllergens(null), []);
  assert.equal(serialiseAllergens(["melk", "gluten", "melk"]), "gluten,melk");
  assert.equal(allergenSummary("gluten,melk,noten"), "Gluten, Melk, Noten");
});

test("sluitingsdagen mogen op twee manieren ingegeven worden", () => {
  const result = parseClosedDatesInput("25/12/2026\n2026-12-26, 1/1/2027");
  assert.deepEqual(result.dates, ["2026-12-25", "2026-12-26", "2027-01-01"]);
  assert.deepEqual(result.invalid, []);

  const withNonsense = parseClosedDatesInput("kerstmis 32/13/2026");
  assert.deepEqual(withNonsense.dates, []);
  assert.deepEqual(withNonsense.invalid, ["kerstmis", "32/13/2026"]);
});

test("het leveringsgebied wordt afgetoetst op postcode", () => {
  assert.equal(deliversToPostalCode("9250"), true);
  assert.equal(deliversToPostalCode(" 9250 "), true);
  assert.equal(deliversToPostalCode("2000"), false);
});

test("een tijdslot hoort bij één soort levering", () => {
  assert.ok(findWindow("delivery", "delivery-thu-am"));
  assert.equal(findWindow("delivery", "pickup-wed-am"), undefined);
  assert.ok(findWindow("pickup", "pickup-sat-am"));
});

test("productnamen worden nette webadressen", () => {
  assert.equal(slugify("Feesttaart op maat"), "feesttaart-op-maat");
  assert.equal(slugify("Boerenbrood mét zuurdesem"), "boerenbrood-met-zuurdesem");
  assert.equal(slugify("'t Broodhuis special!"), "t-broodhuis-special");
  assert.equal(slugify("   "), "");
});
