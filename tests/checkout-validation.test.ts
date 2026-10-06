import assert from "node:assert/strict";
import test from "node:test";

import { checkoutSchema, fieldErrors } from "../src/lib/validation";

test("adresfouten verschijnen ook als de voorwaarden nog niet aangevinkt zijn", () => {
  const result = checkoutSchema.safeParse({
    fulfillmentType: "delivery",
    slot: "2026-10-08__delivery-thu-am",
    customerName: "Marie Peeters",
    customerEmail: "marie@example.com",
    customerPhone: "052 51 95 39",
    street: "",
    houseNumber: "",
    postalCode: "9250",
    city: "",
    acceptTerms: false,
  });

  assert.equal(result.success, false);
  if (result.success) return;

  const errors = fieldErrors(result.error);
  assert.ok(errors.acceptTerms);
  assert.ok(errors.street);
  assert.ok(errors.houseNumber);
  assert.ok(errors.city);
});

test("afhalen vraagt geen adres, wel de voorwaarden", () => {
  const result = checkoutSchema.safeParse({
    fulfillmentType: "pickup",
    slot: "2026-10-07__pickup-wed-am",
    customerName: "Marie Peeters",
    customerEmail: "marie@example.com",
    customerPhone: "052 51 95 39",
    acceptTerms: false,
  });

  assert.equal(result.success, false);
  if (result.success) return;

  const errors = fieldErrors(result.error);
  assert.ok(errors.acceptTerms);
  assert.equal(errors.street, undefined);
});
