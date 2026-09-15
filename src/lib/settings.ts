import { isIsoDate, type IsoDate } from "@/lib/datetime";
import { prisma } from "@/lib/db";

const CLOSED_DATES_KEY = "closedDates";

/**
 * Sluitingsdagen die de bakker zelf beheert via /admin/instellingen.
 * Op die dagen kan er niet afgehaald of geleverd worden.
 */
export async function getClosedDates(): Promise<IsoDate[]> {
  const setting = await prisma.setting.findUnique({
    where: { key: CLOSED_DATES_KEY },
  });
  if (!setting) return [];

  try {
    const parsed: unknown = JSON.parse(setting.value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is string => typeof value === "string")
      .filter(isIsoDate)
      .sort();
  } catch {
    return [];
  }
}

export async function setClosedDates(dates: readonly string[]): Promise<IsoDate[]> {
  const cleaned = [...new Set(dates.map((date) => date.trim()).filter(isIsoDate))].sort();

  await prisma.setting.upsert({
    where: { key: CLOSED_DATES_KEY },
    create: { key: CLOSED_DATES_KEY, value: JSON.stringify(cleaned) },
    update: { value: JSON.stringify(cleaned) },
  });

  return cleaned;
}

/**
 * Leest sluitingsdagen uit vrije tekst (één datum per lijn of komma-gescheiden).
 * Geeft ook terug wat er niet begrepen werd, zodat de admin dat kan tonen.
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
