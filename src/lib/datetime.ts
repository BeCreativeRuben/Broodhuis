/**
 * Kleine tijdzone-helpers zonder externe afhankelijkheden.
 *
 * Bestelmomenten worden bewaard als kalenderdatum ("2026-09-17") plus een
 * tijdslot uit de configuratie. Zo blijft de betekenis eenduidig, ook als de
 * server in UTC draait terwijl de bakkerij in Europe/Brussels staat.
 */

export const BAKERY_TIME_ZONE = "Europe/Brussels";

export type IsoDate = string; // YYYY-MM-DD

type ZonedParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const partsFormatterCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = partsFormatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    partsFormatterCache.set(timeZone, formatter);
  }
  return formatter;
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = partsFormatter(timeZone).formatToParts(date);
  const lookup: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      lookup[part.type] = Number.parseInt(part.value, 10);
    }
  }
  return {
    year: lookup.year,
    month: lookup.month,
    day: lookup.day,
    hour: lookup.hour % 24,
    minute: lookup.minute,
    second: lookup.second,
  };
}

function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = getZonedParts(instant, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    instant.getUTCMilliseconds(),
  );
  return asUtc - instant.getTime();
}

/**
 * Zet een lokale klokstand in de bakkerij-tijdzone om naar een echt moment.
 * Twee iteraties volstaan om zomer-/wintertijd correct te vangen.
 */
export function zonedWallTimeToInstant(
  isoDate: IsoDate,
  time: string,
  timeZone: string = BAKERY_TIME_ZONE,
): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const naive = Date.UTC(year, month - 1, day, hour, minute, 0, 0);

  let instant = new Date(naive - timeZoneOffsetMs(new Date(naive), timeZone));
  const correction = timeZoneOffsetMs(instant, timeZone);
  const corrected = new Date(naive - correction);
  if (corrected.getTime() !== instant.getTime()) {
    instant = corrected;
  }
  return instant;
}

/** Huidige kalenderdatum in de bakkerij-tijdzone. */
export function currentIsoDate(
  now: Date = new Date(),
  timeZone: string = BAKERY_TIME_ZONE,
): IsoDate {
  const parts = getZonedParts(now, timeZone);
  return toIsoDate(parts.year, parts.month, parts.day);
}

export function toIsoDate(year: number, month: number, day: number): IsoDate {
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function addDays(isoDate: IsoDate, days: number): IsoDate {
  const [year, month, day] = isoDate.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return toIsoDate(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
  );
}

/** 0 = zondag ... 6 = zaterdag */
export function weekdayOf(isoDate: IsoDate): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export const WEEKDAY_NAMES_NL = [
  "zondag",
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
] as const;

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function dateFormatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify(options);
  let formatter = dateFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("nl-BE", { ...options, timeZone: "UTC" });
    dateFormatterCache.set(key, formatter);
  }
  return formatter;
}

function isoDateAsUtcMidnight(isoDate: IsoDate): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** "2026-09-17" -> "donderdag 17 september" */
export function formatIsoDateLong(isoDate: IsoDate): string {
  return dateFormatter({
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(isoDateAsUtcMidnight(isoDate));
}

/** "2026-09-17" -> "do 17 sep" */
export function formatIsoDateShort(isoDate: IsoDate): string {
  return dateFormatter({
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(isoDateAsUtcMidnight(isoDate));
}

/** "2026-09-17" -> "17/09/2026" */
export function formatIsoDateNumeric(isoDate: IsoDate): string {
  return dateFormatter({
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(isoDateAsUtcMidnight(isoDate));
}

/**
 * "donderdag 17 september" -> "Donderdag 17 september".
 * Bewust in JavaScript en niet met de CSS-klasse `capitalize`: die maakt er
 * "Donderdag 17 September" van, en in het Nederlands schrijven we maanden klein.
 */
export function capitalizeFirst(value: string): string {
  return value.charAt(0).toLocaleUpperCase("nl-BE") + value.slice(1);
}

/** "08:00" -> "8:00" (Belgische schrijfwijze zonder voorloopnul) */
export function formatTime(time: string): string {
  const [hour, minute] = time.split(":");
  return `${Number.parseInt(hour, 10)}:${minute}`;
}

/** Datum + tijd van een echt moment, in de bakkerij-tijdzone. */
export function formatInstant(date: Date): string {
  return new Intl.DateTimeFormat("nl-BE", {
    timeZone: BAKERY_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}
