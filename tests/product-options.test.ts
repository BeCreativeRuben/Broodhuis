import assert from "node:assert/strict";
import test from "node:test";

import {
  baruFlavourKey,
  baruFlavourName,
  cakeAcceptsPhoto,
  cakeExtraOptions,
  formatChoiceLine,
  isBaruTestzakje,
  packKindLabel,
  teaFlavourSlug,
  teaPackKind,
} from "../src/lib/product-options";
import {
  parseCartSelection,
  formatSelectionSummary,
  combineVariantLabel,
} from "../src/lib/cart-selection";
import {
  joinProductImages,
  parseProductImages,
  isAllowedCustomerPhotoUrl,
} from "../src/lib/product-images";
import { resolveMollieMethods } from "../src/lib/payments/mollie";
import { topLevelGroupSlug, subcategoryChipName } from "../src/lib/category-groups";

test("BARÚ-zussen horen bij dezelfde smaak", () => {
  assert.equal(baruFlavourKey("baru-vanilla-chai-latte"), "baru-vanilla-chai-latte");
  assert.equal(
    baruFlavourKey("baru-vanilla-chai-latte-testzakje"),
    "baru-vanilla-chai-latte",
  );
  assert.equal(isBaruTestzakje("baru-vanilla-chai-latte-testzakje"), true);
  assert.equal(baruFlavourName("BARÚ vanilla chai latte, testzakje"), "BARÚ vanilla chai latte");
});

test("thee-verpakkingen krijgen de namen van Marie", () => {
  assert.equal(teaPackKind("or-tea-doosje", "per doosje"), "doosje");
  assert.equal(teaPackKind("or-tea-blik", "per blik"), "losse-thee");
  assert.equal(packKindLabel("testzakje"), "Testzakje");
  assert.equal(teaFlavourSlug("or-tea-playful-pear-doosje", "Playful Pear"), "or-tea-playful-pear");
});

test("taarten zonder varianten krijgen personen en deeg, biscuit een foto", () => {
  const extras = cakeExtraOptions("fruittaarten", "fruittaarten", []);
  assert.deepEqual(
    extras.map((option) => option.key),
    ["personen", "deeg"],
  );
  assert.equal(cakeAcceptsPhoto("biscuit", "biscuit-cab"), true);
  assert.equal(cakeAcceptsPhoto("fruittaarten", "fruittaarten"), false);
});

test("keuze verschijnt als naam plus verpakking", () => {
  assert.deepEqual(
    formatChoiceLine({
      slug: "baru-vanilla-chai-latte-testzakje",
      name: "BARÚ vanilla chai latte, testzakje",
      unit: "per zakje",
    }),
    { name: "BARÚ vanilla chai latte", variantLabel: "Zakje (1 portie)" },
  );
  assert.deepEqual(
    formatChoiceLine({
      slug: "or-tea-doosje",
      name: "OR TEA?, doosje",
      unit: "per doosje",
      variantLabel: "Playful Pear",
    }),
    { name: "Playful Pear", variantLabel: "Doosje" },
  );
});

test("opschrift en foto mogen alleen gezuiverd de winkelwagen in", () => {
  const ok = parseCartSelection({
    personen: "6 personen",
    deeg: "Bladerdeeg",
    opschrift: "Gefeliciteerd",
    photoUrl: "https://abc.public.blob.vercel-storage.com/foto.jpg",
  });
  assert.deepEqual(ok, {
    personen: "6 personen",
    deeg: "Bladerdeeg",
    opschrift: "Gefeliciteerd",
    photoUrl: "https://abc.public.blob.vercel-storage.com/foto.jpg",
  });
  assert.equal(parseCartSelection({ personen: "20 personen", deeg: "Puff" }), undefined);
  assert.equal(
    formatSelectionSummary(ok),
    "6 personen · Bladerdeeg · Opschrift: Gefeliciteerd · Foto bijgevoegd",
  );
  assert.equal(
    combineVariantLabel("Doosje", { opschrift: "Liefs" }),
    "Doosje · Opschrift: Liefs",
  );
});

test("extra foto's zitten in imageUrl zonder nieuw veld", () => {
  assert.deepEqual(parseProductImages("a.jpg | b.jpg\nc.jpg | a.jpg"), [
    "a.jpg",
    "b.jpg",
    "c.jpg",
  ]);
  assert.equal(joinProductImages(["a.jpg", "", "b.jpg"]), "a.jpg\nb.jpg");
  assert.equal(
    isAllowedCustomerPhotoUrl("https://x.public.blob.vercel-storage.com/p.jpg"),
    true,
  );
  assert.equal(isAllowedCustomerPhotoUrl("https://evil.example/p.jpg"), false);
});

test("Mollie biedt alleen Bancontact en KBC/CBC", () => {
  assert.deepEqual(resolveMollieMethods(undefined), ["bancontact", "kbc"]);
  assert.deepEqual(resolveMollieMethods("bancontact,creditcard,ideal"), ["bancontact"]);
  assert.deepEqual(resolveMollieMethods("creditcard"), ["bancontact", "kbc"]);
});

test("thee en koffie vallen onder Confiserie, met Alles ernaast", () => {
  assert.equal(topLevelGroupSlug("thee"), "confiserie");
  assert.equal(topLevelGroupSlug("koffie"), "confiserie");
  assert.equal(topLevelGroupSlug("snoepgoed"), "confiserie");
  assert.equal(topLevelGroupSlug("brood"), "brood");
  assert.equal(subcategoryChipName({ slug: "snoepgoed", name: "Snoepgoed" }), "Chocolade");
  assert.equal(subcategoryChipName({ slug: "thee", name: "Thee" }), "Thee");
});
