/**
 * Per-kilo producten (kaas, sommige gebakjes) hebben in de database één
 * prijs per kg en een gehele `quantity`. Zonder schemawijziging rekenen we
 * quantity als porties van 250 g — dat past bij de bestaande integer-velden.
 */

export const WEIGHT_STEP_GRAMS = 250;
export const GRAMS_PER_KG = 1000;

export function isPerKgUnit(unit: string): boolean {
  return /(?:^|[\s/])(?:kg|kilo)\b/i.test(unit.trim());
}

export function isWeightPortionUnit(unit: string): boolean {
  return isPerKgUnit(unit) || /250\s*g/i.test(unit);
}

export function portionUnit(unit: string): string {
  return isPerKgUnit(unit) ? "per 250 g" : unit;
}

/** Prijs van één stap (250 g) uit de kiloprijs, of de gewone stukprijs. */
export function portionUnitPriceCents(priceCents: number, unit: string): number {
  if (!isPerKgUnit(unit)) return priceCents;
  return Math.round((priceCents * WEIGHT_STEP_GRAMS) / GRAMS_PER_KG);
}

export function lineTotalCents(
  unitPriceCents: number,
  quantity: number,
  unit: string,
): number {
  if (isPerKgUnit(unit)) {
    return portionUnitPriceCents(unitPriceCents, unit) * quantity;
  }
  return unitPriceCents * quantity;
}

export function formatWeightGrams(grams: number): string {
  if (grams <= 0) return "0 g";
  if (grams % GRAMS_PER_KG === 0) {
    const kilos = grams / GRAMS_PER_KG;
    return `${kilos} kg`;
  }
  return `${grams} g`;
}

/** "2" of "500 g", afhankelijk van de eenheid. */
export function formatQuantityLabel(quantity: number, unit: string): string {
  if (isWeightPortionUnit(unit)) {
    return formatWeightGrams(quantity * WEIGHT_STEP_GRAMS);
  }
  return String(quantity);
}
