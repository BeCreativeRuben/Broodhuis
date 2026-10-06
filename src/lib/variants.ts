/**
 * Keuzes bij één product, op dezelfde manier als taarten die al in
 * ProductVariant staan: optionsJson bevat de dimensies (bij thee alleen smaak).
 */

export type VariantOptions = Record<string, string>;

const OPTION_TITLES: Record<string, string> = {
  smaak: "Smaak",
  personen: "Aantal personen",
  deeg: "Deeg",
  slagroom: "Slagroom",
  verpakking: "Verpakking",
  opschrift: "Opschrift",
};

export function parseOptions(raw: string): VariantOptions {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    const options: VariantOptions = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && value !== "") options[key] = value;
    }
    return options;
  } catch {
    return {};
  }
}

export function optionTitle(key: string): string {
  return OPTION_TITLES[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

export function optionKeys(variants: Array<{ options: VariantOptions }>): string[] {
  const keys: string[] = [];
  for (const variant of variants) {
    for (const key of Object.keys(variant.options)) {
      if (!keys.includes(key)) keys.push(key);
    }
  }
  return keys;
}

export function optionValues(
  variants: Array<{ options: VariantOptions }>,
  key: string,
): string[] {
  const values: string[] = [];
  for (const variant of variants) {
    const value = variant.options[key];
    if (value && !values.includes(value)) values.push(value);
  }
  return values;
}

/** Houdt de andere keuzes vast als die combinatie bestaat, anders de eerste die past. */
export function variantMatching<T extends { options: VariantOptions }>(
  variants: T[],
  current: T,
  key: string,
  value: string,
): T {
  const wanted = { ...current.options, [key]: value };
  const exact = variants.find((variant) =>
    Object.entries(wanted).every(
      ([optionKey, optionValue]) => variant.options[optionKey] === optionValue,
    ),
  );
  if (exact) return exact;
  return variants.find((variant) => variant.options[key] === value) ?? current;
}
