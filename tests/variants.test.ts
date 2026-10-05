import assert from "node:assert/strict";
import test from "node:test";

import {
  optionKeys,
  optionValues,
  parseOptions,
  variantMatching,
} from "../src/lib/variants";

test("optionsJson van een taart wordt een keuzemap", () => {
  assert.deepEqual(
    parseOptions(
      '{"personen":"4 personen","deeg":"Bladerdeeg","slagroom":"Zonder slagroom"}',
    ),
    {
      personen: "4 personen",
      deeg: "Bladerdeeg",
      slagroom: "Zonder slagroom",
    },
  );
});

test("een andere smaak houdt de verpakking, een ontbrekende combinatie valt terug", () => {
  const variants = [
    { id: "calm", options: { smaak: "Beeee Calm" } },
    { id: "pear", options: { smaak: "Playful Pear" } },
  ];

  assert.deepEqual(optionKeys(variants), ["smaak"]);
  assert.deepEqual(optionValues(variants, "smaak"), ["Beeee Calm", "Playful Pear"]);
  assert.equal(
    variantMatching(variants, variants[0], "smaak", "Playful Pear").id,
    "pear",
  );

  const cakes = [
    {
      id: "small",
      options: { deeg: "Bladerdeeg", personen: "4 personen" },
    },
    {
      id: "large",
      options: { deeg: "Bladerdeeg", personen: "6 personen" },
    },
    {
      id: "gist",
      options: { deeg: "Gistdeeg", personen: "4 personen" },
    },
  ];
  assert.equal(
    variantMatching(cakes, cakes[0], "deeg", "Gistdeeg").id,
    "gist",
  );
  assert.equal(
    variantMatching(cakes, cakes[2], "personen", "6 personen").id,
    "large",
  );
});
