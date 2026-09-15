import "server-only";

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

export async function setClosedDates(
  dates: readonly string[],
): Promise<IsoDate[]> {
  const cleaned = [
    ...new Set(dates.map((date) => date.trim()).filter(isIsoDate)),
  ].sort();

  await prisma.setting.upsert({
    where: { key: CLOSED_DATES_KEY },
    create: { key: CLOSED_DATES_KEY, value: JSON.stringify(cleaned) },
    update: { value: JSON.stringify(cleaned) },
  });

  return cleaned;
}
