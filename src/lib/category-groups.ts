/**
 * Categorieën staan plat in de database (geen parent-kolom). In de winkel
 * groeperen we ze op slug, zodat "Biscuit" niet drie keer naast elkaar staat
 * en het bakkersassortiment vóór de retail komt.
 */

export type CategoryGroupKind = "bakery" | "retail" | "other";

export type CategoryGroupDef = {
  slug: string;
  name: string;
  description: string;
  kind: CategoryGroupKind;
};

/**
 * Vaste volgorde voor de chips en de startpagina. Slugs die hier niet staan
 * (een nieuwe seizoenscategorie) vallen achteraan, onder hun eigen naam.
 */
export const CATEGORY_GROUPS: readonly CategoryGroupDef[] = [
  {
    slug: "brood",
    name: "Brood",
    description: "Elke bakdag vers uit de oven.",
    kind: "bakery",
  },
  {
    slug: "klein-brood",
    name: "Klein brood",
    description: "Pistolets, sandwiches, wielen en zoete broodjes.",
    kind: "bakery",
  },
  {
    slug: "koffiekoeken",
    name: "Koffiekoeken",
    description: "Croissants en koffiekoeken van boterdeeg.",
    kind: "bakery",
  },
  {
    slug: "taartpunten",
    name: "Taartpunten",
    description: "Gebak per punt, voor bij de koffie.",
    kind: "bakery",
  },
  {
    slug: "patekes",
    name: "Patékes",
    description: "Kleine gebakjes en tartelettes.",
    kind: "bakery",
  },
  {
    slug: "fruittaarten",
    name: "Fruittaarten",
    description: "Hele taarten met vers fruit.",
    kind: "bakery",
  },
  {
    slug: "biscuit",
    name: "Biscuit",
    description: "Biscuittaarten en klassiekers.",
    kind: "bakery",
  },
  {
    slug: "vlaaien",
    name: "Vlaaien",
    description: "Vlaai, semoule, hartig en cakes.",
    kind: "bakery",
  },
  {
    slug: "drooggebak",
    name: "Drooggebak",
    description: "Eclairs, donuts, koekjes en flan.",
    kind: "bakery",
  },
  {
    slug: "confiserie",
    name: "Confiserie",
    description: "Koekjes, chocolade, thee, koffie en ander zoetgoed.",
    kind: "bakery",
  },
  {
    slug: "patisserie",
    name: "Patisserie",
    description: "Gebak per stuk of hele taarten.",
    kind: "bakery",
  },
  {
    slug: "feesttaarten",
    name: "Feesttaarten",
    description: "Op maat, tijdig bestellen.",
    kind: "bakery",
  },
  {
    slug: "thee",
    name: "Thee",
    description: "Doosjes en blikken om mee te nemen.",
    kind: "retail",
  },
  {
    slug: "dranken",
    name: "Dranken",
    description: "Sappen en andere dranken uit de winkel.",
    kind: "retail",
  },
  {
    slug: "zuivel",
    name: "Zuivel",
    description: "Kaas en zuivel uit de winkel.",
    kind: "retail",
  },
  {
    slug: "confituur",
    name: "Confituur",
    description: "Potten uit de winkel.",
    kind: "retail",
  },
  {
    slug: "snoepgoed",
    name: "Snoepgoed",
    description: "Snoep uit de winkel.",
    kind: "retail",
  },
  {
    slug: "ijs",
    name: "IJs",
    description: "IJs om mee te nemen.",
    kind: "retail",
  },
  {
    slug: "koffie",
    name: "Koffie",
    description: "Koffie uit de winkel.",
    kind: "retail",
  },
] as const;

const GROUP_BY_SLUG = new Map(
  CATEGORY_GROUPS.map((group, index) => [group.slug, { ...group, index }]),
);

const PREFIX_GROUPS = [...CATEGORY_GROUPS].sort(
  (a, b) => b.slug.length - a.slug.length,
);

export type ResolvedCategoryGroup = {
  slug: string;
  name: string;
  description: string | null;
  kind: CategoryGroupKind;
  index: number;
};

/** `koffiekoeken-croissants` → Koffiekoeken; `thee` → Thee. */
export function resolveCategoryGroup(slug: string): ResolvedCategoryGroup {
  const exact = GROUP_BY_SLUG.get(slug);
  if (exact) {
    return {
      slug: exact.slug,
      name: exact.name,
      description: exact.description,
      kind: exact.kind,
      index: exact.index,
    };
  }

  const prefixed = PREFIX_GROUPS.find((group) =>
    slug.startsWith(`${group.slug}-`),
  );
  if (prefixed) {
    const ranked = GROUP_BY_SLUG.get(prefixed.slug);
    return {
      slug: prefixed.slug,
      name: prefixed.name,
      description: prefixed.description,
      kind: prefixed.kind,
      index: ranked?.index ?? CATEGORY_GROUPS.length,
    };
  }

  return {
    slug,
    name: slug,
    description: null,
    kind: "other",
    index: CATEGORY_GROUPS.length,
  };
}

/**
 * Unieke label voor chips, broodkruimels en badges.
 * Subcategorie "Biscuit" onder taartpunten wordt "Taartpunten · Biscuit".
 */
export function categoryDisplayName(category: {
  slug: string;
  name: string;
}): string {
  const group = resolveCategoryGroup(category.slug);
  if (group.slug === category.slug) return category.name;
  if (category.name.toLocaleLowerCase("nl-BE") === group.name.toLocaleLowerCase("nl-BE")) {
    return group.name;
  }
  return `${group.name} · ${category.name}`;
}

export function categoryGroupSortValue(slug: string): number {
  return resolveCategoryGroup(slug).index;
}

/**
 * Thee, koffie en snoepgoed horen in de winkel onder Confiserie, met een
 * eigen chip. De database blijft plat; dit is alleen de weergave.
 */
export const NESTED_UNDER: Record<string, string> = {
  thee: "confiserie",
  koffie: "confiserie",
  snoepgoed: "confiserie",
};

const SUBCATEGORY_CHIP_ALIASES: Record<string, string> = {
  snoepgoed: "Chocolade",
};

export function topLevelGroupSlug(slug: string): string {
  const group = resolveCategoryGroup(slug);
  return NESTED_UNDER[group.slug] ?? group.slug;
}

export function subcategoryChipName(category: {
  slug: string;
  name: string;
}): string {
  const group = resolveCategoryGroup(category.slug);
  if (SUBCATEGORY_CHIP_ALIASES[group.slug]) {
    return SUBCATEGORY_CHIP_ALIASES[group.slug];
  }
  if (group.slug === category.slug) return group.name;
  return categoryDisplayName(category);
}

export function compareCategories(
  a: { slug: string; name: string },
  b: { slug: string; name: string },
): number {
  const byGroup = categoryGroupSortValue(a.slug) - categoryGroupSortValue(b.slug);
  if (byGroup !== 0) return byGroup;
  return a.name.localeCompare(b.name, "nl-BE");
}
