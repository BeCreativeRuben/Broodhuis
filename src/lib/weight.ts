/**
 * Per-kilo producten (kaas, sommige gebakjes) hebben in de database één
 * prijs per kg en een gehele `quantity`. Zonder schemawijziging rekenen we
 * quantity als porties van 250 g — dat past bij de bestaande integer-velden.
 *
 * De lijnprijs is kiloprijs × gewicht, één keer afgerond per lijn — niet
 * eerst per stap van 250 g.
 */

export const WEIGHT_STEP_GRAMS = 250;
export const GRAMS_PER_KG = 1000;

export function isPerKgUnit(unit: string): boolean {
  return /(?:^|[\s/])(?:kg|kilo)\b/i.test(unit.trim());
}

export function isWeightPortionUnit(unit: string): boolean {
  return isPerKgUnit(unit) || /250\s*g/i.test(unit);
}

/** Hoeveel gram één quantity-eenheid is (250 g bij kilo, anders 0). */
export function quantityGrams(quantity: number, unit: string): number {
  if (!isWeightPortionUnit(unit)) return 0;
  return quantity * WEIGHT_STEP_GRAMS;
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
    return formatWeightGrams(quantityGrams(quantity, unit));
  }
  return String(quantity);
}

/** "500 g Klaartjes Kaas jong" of "2× Croissant". */
export function formatOrderLineLabel(
  quantity: number,
  unit: string,
  name: string,
): string {
  if (isWeightPortionUnit(unit)) {
    return `${formatQuantityLabel(quantity, unit)} ${name}`;
  }
  return `${quantity}× ${name}`;
}

/**
 * Prijs van één stap (250 g) uit de kiloprijs, of de gewone stukprijs.
 * Enkel voor weergave van de stap; de lijnprijs gebruikt lineTotalCents.
 */
export function portionUnitPriceCents(priceCents: number, unit: string): number {
  if (!isPerKgUnit(unit) && !isWeightPortionUnit(unit)) return priceCents;
  if (isPerKgUnit(unit)) {
    return Math.round((priceCents * WEIGHT_STEP_GRAMS) / GRAMS_PER_KG);
  }
  return priceCents;
}

/**
 * Lijnprijs: bij kilo één afronding op (prijs/kg × gewicht), anders stuk × aantal.
 * `unitPriceCents` is de catalogusprijs (per kg of per stuk), niet de stap van 250 g.
 */
export function lineTotalCents(
  unitPriceCents: number,
  quantity: number,
  unit: string,
): number {
  if (isPerKgUnit(unit)) {
    return Math.round(
      (unitPriceCents * quantity * WEIGHT_STEP_GRAMS) / GRAMS_PER_KG,
    );
  }
  return unitPriceCents * quantity;
}

/** Gewichtlijnen tellen als één artikel, stuks als hun aantal. */
export function displayItemCount(
  items: Array<{ quantity: number; unit: string }>,
): number {
  return items.reduce(
    (total, line) =>
      total + (isWeightPortionUnit(line.unit) ? 1 : line.quantity),
    0,
  );
}

/** "500 g" bij één gewichtlijn, anders "3 stuks". */
export function formatCartCountLabel(
  items: Array<{ quantity: number; unit: string }>,
): string {
  if (items.length === 0) return "0 stuks";
  if (items.length === 1 && isWeightPortionUnit(items[0].unit)) {
    return formatQuantityLabel(items[0].quantity, items[0].unit);
  }
  const count = displayItemCount(items);
  return `${count} ${count === 1 ? "stuk" : "stuks"}`;
}
