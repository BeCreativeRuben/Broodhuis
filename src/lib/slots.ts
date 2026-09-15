import {
  addDays,
  currentIsoDate,
  formatIsoDateLong,
  formatIsoDateShort,
  formatTime,
  isIsoDate,
  weekdayOf,
  zonedWallTimeToInstant,
  type IsoDate,
} from "@/lib/datetime";
import {
  FULFILLMENT,
  findWindow,
  windowsFor,
  type FulfillmentType,
} from "@/lib/shop-config";

export type Slot = {
  /** Waarde in het formulier: "2026-09-17__delivery-thu-am" */
  value: string;
  date: IsoDate;
  windowId: string;
  weekday: number;
  start: string;
  end: string;
  /** "donderdag 17 september" */
  dateLabel: string;
  /** "do 17 sep" */
  dateLabelShort: string;
  /** "9:00 - 12:00" */
  timeLabel: string;
  /** "donderdag 17 september, 9:00 - 12:00" */
  label: string;
  /** Tot wanneer kan dit moment nog gekozen worden? */
  orderableUntil: Date;
};

const SLOT_SEPARATOR = "__";

export function encodeSlotValue(date: IsoDate, windowId: string): string {
  return `${date}${SLOT_SEPARATOR}${windowId}`;
}

export function decodeSlotValue(
  value: string,
): { date: IsoDate; windowId: string } | null {
  const [date, windowId] = value.split(SLOT_SEPARATOR);
  if (!date || !windowId || !isIsoDate(date)) return null;
  return { date, windowId };
}

/** Laatste moment waarop een bestelling voor `date` nog binnen mag komen. */
export function cutoffInstantFor(date: IsoDate): Date {
  const { daysBefore, hour } = FULFILLMENT.orderCutoff;
  const cutoffDate = addDays(date, -daysBefore);
  return zonedWallTimeToInstant(cutoffDate, `${String(hour).padStart(2, "0")}:00`);
}

function buildSlot(
  date: IsoDate,
  serviceWindow: { id: string; start: string; end: string },
): Slot {
  const timeLabel = `${formatTime(serviceWindow.start)} - ${formatTime(serviceWindow.end)}`;
  const dateLabel = formatIsoDateLong(date);
  return {
    value: encodeSlotValue(date, serviceWindow.id),
    date,
    windowId: serviceWindow.id,
    weekday: weekdayOf(date),
    start: serviceWindow.start,
    end: serviceWindow.end,
    dateLabel,
    dateLabelShort: formatIsoDateShort(date),
    timeLabel,
    label: `${dateLabel}, ${timeLabel}`,
    orderableUntil: cutoffInstantFor(date),
  };
}

export type SlotQuery = {
  type: FulfillmentType;
  /** Grootste levertijd uit de winkelwagen, in dagen */
  leadTimeDays?: number;
  closedDates?: readonly IsoDate[];
  now?: Date;
};

export function getAvailableSlots({
  type,
  leadTimeDays = 0,
  closedDates = [],
  now = new Date(),
}: SlotQuery): Slot[] {
  const closed = new Set([...FULFILLMENT.closedDates, ...closedDates]);
  const today = currentIsoDate(now);
  const firstDate = addDays(today, Math.max(0, leadTimeDays));
  const lastDate = addDays(today, FULFILLMENT.weeksAhead * 7 + leadTimeDays);
  const windows = windowsFor(type);

  const slots: Slot[] = [];
  for (let date = firstDate; date <= lastDate; date = addDays(date, 1)) {
    if (closed.has(date)) continue;
    const weekday = weekdayOf(date);
    for (const serviceWindow of windows) {
      if (serviceWindow.weekday !== weekday) continue;
      if (now.getTime() >= cutoffInstantFor(date).getTime()) continue;
      slots.push(buildSlot(date, serviceWindow));
    }
  }
  return slots;
}

/** Slots gegroepeerd per dag — handig voor de keuzelijst in de checkout. */
export function groupSlotsByDate(slots: Slot[]): Array<{
  date: IsoDate;
  dateLabel: string;
  dateLabelShort: string;
  slots: Slot[];
}> {
  const groups = new Map<IsoDate, Slot[]>();
  for (const slot of slots) {
    const existing = groups.get(slot.date);
    if (existing) {
      existing.push(slot);
    } else {
      groups.set(slot.date, [slot]);
    }
  }
  return [...groups.entries()].map(([date, dateSlots]) => ({
    date,
    dateLabel: dateSlots[0].dateLabel,
    dateLabelShort: dateSlots[0].dateLabelShort,
    slots: dateSlots,
  }));
}

export type SlotValidation =
  { ok: true; slot: Slot } | { ok: false; reason: string };

/**
 * Controleert een door de klant gekozen moment opnieuw op de server:
 * bestaat het slot, is de sluitingstijd nog niet voorbij, en respecteert het
 * de langste levertijd in de winkelwagen?
 */
export function validateSlotSelection({
  type,
  slotValue,
  leadTimeDays = 0,
  closedDates = [],
  now = new Date(),
}: SlotQuery & { slotValue: string }): SlotValidation {
  const decoded = decodeSlotValue(slotValue);
  if (!decoded) {
    return { ok: false, reason: "Kies een geldig moment." };
  }

  const serviceWindow = findWindow(type, decoded.windowId);
  if (!serviceWindow) {
    return {
      ok: false,
      reason:
        type === "delivery"
          ? "Dit leveringsmoment bestaat niet (meer). Kies een ander moment."
          : "Dit afhaalmoment bestaat niet (meer). Kies een ander moment.",
    };
  }

  if (serviceWindow.weekday !== weekdayOf(decoded.date)) {
    return { ok: false, reason: "Dit moment past niet bij de gekozen dag." };
  }

  const closed = new Set([...FULFILLMENT.closedDates, ...closedDates]);
  if (closed.has(decoded.date)) {
    return {
      ok: false,
      reason: "De bakkerij is die dag gesloten. Kies een ander moment.",
    };
  }

  if (now.getTime() >= cutoffInstantFor(decoded.date).getTime()) {
    return {
      ok: false,
      reason:
        "De besteltijd voor dit moment is verstreken. Kies het volgende beschikbare moment.",
    };
  }

  const earliest = addDays(currentIsoDate(now), Math.max(0, leadTimeDays));
  if (decoded.date < earliest) {
    return {
      ok: false,
      reason: `Door de bestelperiode van je producten kan dit pas vanaf ${formatIsoDateLong(earliest)}.`,
    };
  }

  return { ok: true, slot: buildSlot(decoded.date, serviceWindow) };
}

/** Compacte samenvatting voor de homepage, bv. "do 17 sep, vr 18 sep, zo 20 sep". */
export function upcomingDeliveryDates(count = 3, now = new Date()): string[] {
  return getAvailableSlots({ type: "delivery", now })
    .slice(0, count)
    .map((slot) => `${slot.dateLabelShort} (${slot.timeLabel})`);
}
