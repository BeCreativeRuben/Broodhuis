const euroFormatter = new Intl.NumberFormat("nl-BE", {
  style: "currency",
  currency: "EUR",
});

/** 350 -> "€ 3,50" */
export function formatEuro(cents: number): string {
  return euroFormatter.format(cents / 100).replace(/\u00a0/g, " ");
}

/** 350 -> "3.50" (formaat dat Mollie verwacht) */
export function centsToDecimalString(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** "3,50" of "3.50" of "3" -> 350. Geeft null bij ongeldige invoer. */
export function parseEuroInputToCents(input: string): number | null {
  const normalised = input.trim().replace(/\s|€/g, "").replace(",", ".");
  if (normalised === "" || !/^\d+(\.\d{1,2})?$/.test(normalised)) {
    return null;
  }
  return Math.round(Number.parseFloat(normalised) * 100);
}

/** 350 -> "3,50", voor het vullen van een prijsveld in de admin */
export function centsToEuroInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
