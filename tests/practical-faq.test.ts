import assert from "node:assert/strict";
import test from "node:test";

import {
  practicalFaqAnswerText,
  practicalFaqItems,
  practicalFaqJsonLd,
} from "../src/lib/practical-faq";
import { FULFILLMENT, SHOP } from "../src/lib/shop-config";

test("FAQ dekt bestellen, afhalen, leveren en betalen uit de shopconfig", () => {
  const items = practicalFaqItems();
  const byQuestion = new Map(items.map((item) => [item.question, practicalFaqAnswerText(item)]));

  assert.match(
    byQuestion.get("Wanneer moet ik bestellen?") ?? "",
    new RegExp(`tot ${FULFILLMENT.orderCutoff.hour}u de dag vóór`),
  );
  assert.match(
    byQuestion.get("Tot wanneer kan ik vooruit boeken?") ?? "",
    new RegExp(`${FULFILLMENT.weeksAhead} weken`),
  );
  assert.match(byQuestion.get("Tot wanneer kan ik vooruit boeken?") ?? "", /31 december/);

  const pickup = byQuestion.get("Wanneer kan ik afhalen?") ?? "";
  assert.match(pickup, /woensdagvoormiddag \(8:00 - 12:30\)/);
  assert.match(pickup, /zaterdagvoormiddag \(7:30 - 13:00\)/);
  assert.match(pickup, /zondagvoormiddag \(7:30 - 12:30\)/);
  assert.match(pickup, /Maandag en dinsdag is de winkel gesloten/);
  assert.match(pickup, /indicatief/);

  const delivery = byQuestion.get("Wanneer leveren jullie?") ?? "";
  assert.match(delivery, /€ 2,50/);
  assert.match(delivery, new RegExp(FULFILLMENT.deliveryPostalCodes[0]));
  assert.match(delivery, new RegExp(SHOP.city));
  assert.match(delivery, /donderdagvoormiddag \(9:00 - 12:00\)/);
  assert.match(delivery, /vrijdagnamiddag \(13:30 - 17:00\)/);
  assert.match(delivery, /zondagvoormiddag \(9:00 - 12:00\)/);

  const payment = byQuestion.get("Hoe betaal ik?") ?? "";
  assert.match(payment, /Bancontact/);
  assert.match(payment, /KBC\/CBC/);
  assert.match(payment, /pas definitief wanneer de betaling gelukt is/);
});

test("FAQ herhaalt alleen beleid dat al in de voorwaarden en allergenentekst staat", () => {
  const items = practicalFaqItems();
  const cancel = items.find((item) => item.question === "Kan ik wijzigen of annuleren?");
  const allergens = items.find((item) => item.question === "Hoe zit het met allergenen?");

  assert.ok(cancel);
  assert.equal(cancel.link?.href, "/voorwaarden");
  assert.match(practicalFaqAnswerText(cancel), /boek VI WER/);
  assert.match(practicalFaqAnswerText(cancel), new RegExp(SHOP.phone.replace(/ /g, " ")));
  assert.match(practicalFaqAnswerText(cancel), /dezelfde betaalwijze/);

  assert.ok(allergens);
  assert.match(practicalFaqAnswerText(allergens), /14 wettelijke allergenen/);
  assert.match(practicalFaqAnswerText(allergens), /gluten, melk, eieren, noten en sesam/);
});

test("FAQPage JSON-LD volgt de zichtbare vragen en antwoorden", () => {
  const items = practicalFaqItems();
  const jsonLd = practicalFaqJsonLd(items);

  assert.equal(jsonLd["@type"], "FAQPage");
  assert.equal(jsonLd.mainEntity.length, items.length);
  jsonLd.mainEntity.forEach((entity, index) => {
    assert.equal(entity["@type"], "Question");
    assert.equal(entity.name, items[index].question);
    assert.equal(entity.acceptedAnswer["@type"], "Answer");
    assert.equal(entity.acceptedAnswer.text, practicalFaqAnswerText(items[index]));
  });
});
