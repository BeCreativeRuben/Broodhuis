import assert from "node:assert/strict";
import test from "node:test";

import {
  categoryDisplayName,
  compareCategories,
  resolveCategoryGroup,
} from "../src/lib/category-groups";

test("subcategorieën horen bij hun oudergroep", () => {
  assert.equal(resolveCategoryGroup("koffiekoeken-croissants").name, "Koffiekoeken");
  assert.equal(resolveCategoryGroup("brood-wit-galet").slug, "brood");
  assert.equal(resolveCategoryGroup("klein-brood-pistolets").slug, "klein-brood");
  assert.equal(resolveCategoryGroup("thee").name, "Thee");
  assert.equal(resolveCategoryGroup("biscuit-cab").name, "Biscuit");
});

test("dubbele subnamen krijgen de oudergroep erbij", () => {
  assert.equal(
    categoryDisplayName({ slug: "taartpunten-biscuit", name: "Biscuit" }),
    "Taartpunten · Biscuit",
  );
  assert.equal(
    categoryDisplayName({ slug: "patekes-biscuit", name: "Biscuit" }),
    "Patékes · Biscuit",
  );
  assert.equal(categoryDisplayName({ slug: "thee", name: "Thee" }), "Thee");
});

test("bakkerij komt vóór retail", () => {
  const sorted = [
    { slug: "koffie", name: "Koffie" },
    { slug: "brood-zoet", name: "Zoet" },
    { slug: "thee", name: "Thee" },
    { slug: "koffiekoeken-croissants", name: "Croissants" },
  ].sort(compareCategories);

  assert.deepEqual(
    sorted.map((category) => category.slug),
    ["brood-zoet", "koffiekoeken-croissants", "thee", "koffie"],
  );
});
