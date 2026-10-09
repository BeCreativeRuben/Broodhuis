import assert from "node:assert/strict";
import test from "node:test";

import {
  displayItemCount,
  formatCartCountLabel,
  formatOrderLineLabel,
  formatQuantityLabel,
  isPerKgUnit,
  lineTotalCents,
  portionUnitPriceCents,
} from "../src/lib/weight";

test("per-kilo eenheden worden herkend", () => {
  assert.equal(isPerKgUnit("per kg"), true);
  assert.equal(isPerKgUnit("per kilo"), true);
  assert.equal(isPerKgUnit("/kg"), true);
  assert.equal(isPerKgUnit("per stuk"), false);
  assert.equal(isPerKgUnit("per 250 g"), false);
});

test("250 g-stap is een kwart van de kiloprijs (alleen weergave)", () => {
  assert.equal(portionUnitPriceCents(2233, "per kg"), 558);
  assert.equal(portionUnitPriceCents(350, "per stuk"), 350);
});

test("lijnprijs rondt één keer af op kiloprijs × gewicht", () => {
  // 500 g van € 22,33/kg: 2233 × 0,5 = 1116,5 → € 11,17 (niet 2 × € 5,58)
  assert.equal(lineTotalCents(2233, 2, "per kg"), 1117);
  assert.equal(lineTotalCents(2233, 1, "per kg"), 558);
  assert.equal(lineTotalCents(350, 2, "per stuk"), 700);
});

test("gewichtlabels blijven leesbaar", () => {
  assert.equal(formatQuantityLabel(1, "per kg"), "250 g");
  assert.equal(formatQuantityLabel(2, "per 250 g"), "500 g");
  assert.equal(formatQuantityLabel(4, "per kg"), "1 kg");
  assert.equal(formatQuantityLabel(3, "per stuk"), "3");
  assert.equal(
    formatOrderLineLabel(2, "per kg", "Klaartjes Kaas jong"),
    "500 g Klaartjes Kaas jong",
  );
  assert.equal(formatOrderLineLabel(2, "per stuk", "Croissant"), "2× Croissant");
});

test("winkelwagen telt een gewichtlijn als één artikel", () => {
  assert.equal(displayItemCount([{ quantity: 2, unit: "per kg" }]), 1);
  assert.equal(
    displayItemCount([
      { quantity: 2, unit: "per kg" },
      { quantity: 3, unit: "per stuk" },
    ]),
    4,
  );
  assert.equal(
    formatCartCountLabel([{ quantity: 2, unit: "per kg" }]),
    "500 g",
  );
  assert.equal(
    formatCartCountLabel([{ quantity: 3, unit: "per stuk" }]),
    "3 stuks",
  );
});
