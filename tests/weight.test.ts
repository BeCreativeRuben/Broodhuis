import assert from "node:assert/strict";
import test from "node:test";

import {
  formatQuantityLabel,
  isPerKgUnit,
  lineTotalCents,
  portionUnit,
  portionUnitPriceCents,
} from "../src/lib/weight";

test("per-kilo eenheden worden herkend", () => {
  assert.equal(isPerKgUnit("per kg"), true);
  assert.equal(isPerKgUnit("per kilo"), true);
  assert.equal(isPerKgUnit("/kg"), true);
  assert.equal(isPerKgUnit("per stuk"), false);
  assert.equal(isPerKgUnit("per 250 g"), false);
});

test("250 g is een kwart van de kiloprijs", () => {
  assert.equal(portionUnitPriceCents(2233, "per kg"), 558);
  assert.equal(portionUnit("per kg"), "per 250 g");
  assert.equal(lineTotalCents(2233, 2, "per kg"), 1116);
  assert.equal(lineTotalCents(350, 2, "per stuk"), 700);
});

test("gewichtlabels blijven leesbaar", () => {
  assert.equal(formatQuantityLabel(1, "per kg"), "250 g");
  assert.equal(formatQuantityLabel(2, "per 250 g"), "500 g");
  assert.equal(formatQuantityLabel(4, "per kg"), "1 kg");
  assert.equal(formatQuantityLabel(3, "per stuk"), "3");
});
