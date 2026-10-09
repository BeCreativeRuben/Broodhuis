import type { VariantOptions } from "@/lib/variants";

/**
 * Keuzes die Marie wil zien, zonder nieuwe tabellen:
 * bestaande ProductVariant-rijen waar die er zijn, anders een
 * weergavelaag (BARÚ-zussen, thee per smaak, taartopties aan dezelfde prijs).
 */

export const CAKE_SIZE_VALUES = [
  "4 personen",
  "6 personen",
  "8 personen",
  "10 personen",
  "12 personen",
] as const;

export const CAKE_DOUGH_VALUES = ["Bladerdeeg", "Zanddeeg"] as const;

export const CAKE_GROUP_SLUGS = new Set([
  "fruittaarten",
  "biscuit",
  "vlaaien",
  "feesttaarten",
  "patisserie",
]);

export type ExtraOptionSpec = {
  key: "personen" | "deeg";
  title: string;
  values: string[];
};

export type PackKind = "doosje" | "losse-thee" | "testzakje" | "doos" | "zakje";

export function isCakeCategory(groupSlug: string, categorySlug?: string): boolean {
  if (CAKE_GROUP_SLUGS.has(groupSlug)) return true;
  if (!categorySlug) return false;
  return [...CAKE_GROUP_SLUGS].some(
    (slug) => categorySlug === slug || categorySlug.startsWith(`${slug}-`),
  );
}

export function cakeWantsDough(groupSlug: string, categorySlug?: string): boolean {
  return groupSlug === "fruittaarten" || Boolean(categorySlug?.startsWith("fruittaarten"));
}

export function cakeAcceptsPhoto(groupSlug: string, categorySlug?: string): boolean {
  return groupSlug === "biscuit" || Boolean(categorySlug?.startsWith("biscuit"));
}

export function cakeExtraOptions(
  groupSlug: string,
  categorySlug: string,
  variantOptions: VariantOptions[],
): ExtraOptionSpec[] {
  if (!isCakeCategory(groupSlug, categorySlug)) return [];
  const extras: ExtraOptionSpec[] = [];
  const hasPersonen = variantOptions.some((options) => options.personen);
  const hasDeeg = variantOptions.some((options) => options.deeg);
  if (!hasPersonen) {
    extras.push({
      key: "personen",
      title: "Aantal personen",
      values: [...CAKE_SIZE_VALUES],
    });
  }
  if (!hasDeeg && cakeWantsDough(groupSlug, categorySlug)) {
    extras.push({
      key: "deeg",
      title: "Deeg",
      values: [...CAKE_DOUGH_VALUES],
    });
  }
  return extras;
}

export function baruFlavourKey(slug: string): string | null {
  const match = /^(baru-.+?)(?:-testzakje)?$/.exec(slug);
  return match ? match[1] : null;
}

export function isBaruTestzakje(slug: string): boolean {
  return slug.endsWith("-testzakje") && slug.startsWith("baru-");
}

export function baruFlavourName(name: string): string {
  return name
    .replace(/,?\s*testzakje$/i, "")
    .replace(/\s+per blik$/i, "")
    .trim();
}

export function teaPackKind(slug: string, unit?: string): PackKind | null {
  if (slug.includes("testzakje") || /testzakje/i.test(unit ?? "")) {
    return "testzakje";
  }
  if (slug.includes("doosje") || /doosje/i.test(unit ?? "")) return "doosje";
  if (slug.includes("blik") || /blik/i.test(unit ?? "") || /losse/i.test(unit ?? "")) {
    return "losse-thee";
  }
  return null;
}

export function packKindLabel(kind: PackKind): string {
  switch (kind) {
    case "doosje":
      return "Doosje";
    case "losse-thee":
      return "Losse thee";
    case "testzakje":
      return "Testzakje";
    case "doos":
      return "Doos";
    case "zakje":
      return "Zakje (1 portie)";
  }
}

export function teaFlavourSlug(sourceSlug: string | null | undefined, flavour: string): string {
  if (sourceSlug) {
    return sourceSlug
      .replace(/-doosje$/, "")
      .replace(/-blik$/, "")
      .replace(/-testzakje$/, "");
  }
  return `or-tea-${flavour
    .toLocaleLowerCase("nl-BE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

export type LineIdentity = {
  slug: string;
  name: string;
  unit: string;
  variantLabel?: string | null;
};

/** Naam + keuze zoals die in wagen, bestelling, admin en daglijst hoort. */
export function formatChoiceLine(line: LineIdentity): {
  name: string;
  variantLabel: string | null;
} {
  const slug = line.slug;
  const baruKey = baruFlavourKey(slug);
  if (baruKey) {
    const flavour = baruFlavourName(line.name);
    const pack = isBaruTestzakje(slug)
      ? packKindLabel("zakje")
      : packKindLabel("doos");
    return { name: flavour, variantLabel: joinLabels(pack, line.variantLabel) };
  }

  const teaKind = teaPackKind(slug, line.unit);
  if (teaKind && (slug.startsWith("or-tea-") || /or tea/i.test(line.name))) {
    const flavour =
      line.variantLabel && !line.variantLabel.includes("personen")
        ? line.variantLabel
        : line.name.replace(/^OR TEA\??,?\s*/i, "").replace(/,?\s*(doosje|blik)$/i, "");
    return {
      name: flavour,
      variantLabel: joinLabels(packKindLabel(teaKind), null),
    };
  }

  return {
    name: line.name,
    variantLabel: line.variantLabel ?? null,
  };
}

function joinLabels(
  pack: string,
  extra: string | null | undefined,
): string {
  if (extra && extra !== pack) return `${pack} · ${extra}`;
  return pack;
}

export function choiceButtonLabel(input: {
  categorySlug: string;
  groupSlug: string;
  hasPackChoice?: boolean;
}): string {
  if (input.categorySlug === "thee" || input.hasPackChoice) return "Kies een verpakking";
  if (input.categorySlug === "koffie" || input.groupSlug === "koffie") {
    return "Kies een verpakking";
  }
  if (isCakeCategory(input.groupSlug, input.categorySlug)) return "Kies een maat";
  return "Kies een optie";
}
