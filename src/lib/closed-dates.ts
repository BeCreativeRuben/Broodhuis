import { isIsoDate, type IsoDate } from "@/lib/datetime";

/**
 * Leest sluitingsdagen uit vrije tekst (één datum per lijn of komma-gescheiden).
 * Geeft ook terug wat er niet begrepen werd, zodat de admin dat kan tonen.
 * Bewust zonder database-import, zodat dit ook los te testen valt.
 */
export function parseClosedDatesInput(input: string): {
  dates: IsoDate[];
  invalid: string[];
} {
  const tokens = input
    .split(/[\s,;]+/)
    .map((token) => token.trim())
    .filter((token) => token !== "");

  const dates: IsoDate[] = [];
  const invalid: string[] = [];

  for (const token of tokens) {
    const normalised = normaliseDateToken(token);
    if (normalised) {
      dates.push(normalised);
    } else {
      invalid.push(token);
    }
  }

  return { dates: [...new Set(dates)].sort(), invalid };
}

/** Aanvaardt 2026-12-25 en 25/12/2026. */
function normaliseDateToken(token: string): IsoDate | null {
  if (isIsoDate(token)) return token;

  const belgianFormat = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(token);
  if (belgianFormat) {
    const [, day, month, year] = belgianFormat;
    const candidate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    if (isIsoDate(candidate)) return candidate;
  }

  return null;
}
