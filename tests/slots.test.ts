import assert from "node:assert/strict";
import test from "node:test";

import {
  addDays,
  currentIsoDate,
  formatIsoDateLong,
  weekdayOf,
  zonedWallTimeToInstant,
} from "../src/lib/datetime";
import { FULFILLMENT } from "../src/lib/shop-config";
import {
  cutoffInstantFor,
  decodeSlotValue,
  encodeSlotValue,
  getAvailableSlots,
  groupSlotsByDate,
  validateSlotSelection,
} from "../src/lib/slots";

/** Dinsdag 15 september 2026, 10:00 in Brussel. */
const TUESDAY_MORNING = zonedWallTimeToInstant("2026-09-15", "10:00");

test("kalenderrekenwerk blijft kloppen over maandgrenzen", () => {
  assert.equal(addDays("2026-09-30", 1), "2026-10-01");
  assert.equal(addDays("2026-01-01", -1), "2025-12-31");
  assert.equal(addDays("2028-02-28", 1), "2028-02-29"); // schrikkeljaar
  assert.equal(weekdayOf("2026-09-15"), 2); // dinsdag
  assert.equal(weekdayOf("2026-09-20"), 0); // zondag
});

test("zomer- en wintertijd worden correct omgezet", () => {
  // Zomertijd in Brussel: UTC+2
  assert.equal(
    zonedWallTimeToInstant("2026-07-01", "18:00").toISOString(),
    "2026-07-01T16:00:00.000Z",
  );
  // Wintertijd in Brussel: UTC+1
  assert.equal(
    zonedWallTimeToInstant("2026-12-01", "18:00").toISOString(),
    "2026-12-01T17:00:00.000Z",
  );
});

test("de huidige dag wordt in de bakkerij-tijdzone bepaald", () => {
  // 23:30 UTC is in Brussel al de volgende dag
  assert.equal(currentIsoDate(new Date("2026-09-15T23:30:00.000Z")), "2026-09-16");
});

test("leveren kan enkel donderdag, vrijdag en zondag", () => {
  const slots = getAvailableSlots({ type: "delivery", now: TUESDAY_MORNING });
  const weekdays = new Set(slots.map((slot) => slot.weekday));

  assert.deepEqual([...weekdays].sort(), [0, 4, 5]); // zondag, donderdag, vrijdag
  assert.ok(slots.length >= 3);

  const thursday = slots.find((slot) => slot.weekday === 4);
  const friday = slots.find((slot) => slot.weekday === 5);
  const sunday = slots.find((slot) => slot.weekday === 0);

  assert.equal(thursday?.timeLabel, "9:00 - 12:00"); // voormiddag
  assert.equal(friday?.timeLabel, "13:30 - 17:00"); // namiddag
  assert.equal(sunday?.timeLabel, "9:00 - 12:00"); // voormiddag
});

test("afhalen kan van woensdag tot en met zondag, nooit op maandag of dinsdag", () => {
  const slots = getAvailableSlots({ type: "pickup", now: TUESDAY_MORNING });
  const weekdays = new Set(slots.map((slot) => slot.weekday));

  assert.deepEqual([...weekdays].sort(), [0, 3, 4, 5, 6]);
  assert.ok(!weekdays.has(1) && !weekdays.has(2));
});

test("het eerste moment ligt na de besteldeadline van 18u", () => {
  // Dinsdag 10:00: morgen (woensdag) kan nog, de deadline is vanavond 18u.
  const early = getAvailableSlots({ type: "pickup", now: TUESDAY_MORNING });
  assert.equal(early[0].date, "2026-09-16");

  // Dinsdag 20:00: te laat voor woensdag, dus donderdag.
  const late = getAvailableSlots({
    type: "pickup",
    now: zonedWallTimeToInstant("2026-09-15", "20:00"),
  });
  assert.equal(late[0].date, "2026-09-17");
});

test("de deadline zelf valt op 18u de dag ervoor, lokale tijd", () => {
  const cutoff = cutoffInstantFor("2026-09-17");
  assert.equal(cutoff.toISOString(), "2026-09-16T16:00:00.000Z"); // 18u Brussel
});

test("een bestelperiode schuift de vroegste datum op", () => {
  const slots = getAvailableSlots({
    type: "pickup",
    leadTimeDays: 14,
    now: TUESDAY_MORNING,
  });

  const earliest = addDays("2026-09-15", 14);
  assert.equal(earliest, "2026-09-29");
  assert.ok(
    slots.every((slot) => slot.date >= earliest),
    "geen enkel moment mag vóór de bestelperiode vallen",
  );
  assert.ok(slots.length > 0);
});

test("sluitingsdagen verdwijnen uit de keuzelijst", () => {
  const closed = ["2026-09-17"];
  const slots = getAvailableSlots({
    type: "delivery",
    closedDates: closed,
    now: TUESDAY_MORNING,
  });

  assert.ok(slots.every((slot) => slot.date !== "2026-09-17"));
});

test("slots worden per dag gegroepeerd", () => {
  const slots = getAvailableSlots({ type: "pickup", now: TUESDAY_MORNING });
  const groups = groupSlotsByDate(slots);

  assert.equal(groups.length, new Set(slots.map((slot) => slot.date)).size);
  assert.equal(groups[0].date, slots[0].date);
});

test("de slotwaarde kan heen en terug", () => {
  const value = encodeSlotValue("2026-09-17", "delivery-thu-am");
  assert.deepEqual(decodeSlotValue(value), {
    date: "2026-09-17",
    windowId: "delivery-thu-am",
  });
  assert.equal(decodeSlotValue("onzin"), null);
  assert.equal(decodeSlotValue("2026-13-45__delivery-thu-am"), null);
});

test("de server keurt een geldig leveringsmoment goed", () => {
  const result = validateSlotSelection({
    type: "delivery",
    slotValue: encodeSlotValue("2026-09-17", "delivery-thu-am"),
    now: TUESDAY_MORNING,
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.slot.date, "2026-09-17");
    assert.equal(result.slot.label, "donderdag 17 september, 9:00 - 12:00");
  }
});

test("de server weigert gesleutelde of verlopen momenten", () => {
  // Afhaalslot doorgeven als levering
  assert.equal(
    validateSlotSelection({
      type: "delivery",
      slotValue: encodeSlotValue("2026-09-16", "pickup-wed-am"),
      now: TUESDAY_MORNING,
    }).ok,
    false,
  );

  // Leveringsslot op de verkeerde weekdag (17 september is een donderdag)
  assert.equal(
    validateSlotSelection({
      type: "delivery",
      slotValue: encodeSlotValue("2026-09-17", "delivery-fri-pm"),
      now: TUESDAY_MORNING,
    }).ok,
    false,
  );

  // Deadline voorbij
  assert.equal(
    validateSlotSelection({
      type: "pickup",
      slotValue: encodeSlotValue("2026-09-16", "pickup-wed-am"),
      now: zonedWallTimeToInstant("2026-09-15", "20:00"),
    }).ok,
    false,
  );

  // Sluitingsdag
  assert.equal(
    validateSlotSelection({
      type: "delivery",
      slotValue: encodeSlotValue("2026-09-17", "delivery-thu-am"),
      closedDates: ["2026-09-17"],
      now: TUESDAY_MORNING,
    }).ok,
    false,
  );

  // Bestelperiode niet gerespecteerd
  assert.equal(
    validateSlotSelection({
      type: "delivery",
      slotValue: encodeSlotValue("2026-09-17", "delivery-thu-am"),
      leadTimeDays: 14,
      now: TUESDAY_MORNING,
    }).ok,
    false,
  );
});

test("de keuzelijst blijft binnen het ingestelde aantal weken", () => {
  const slots = getAvailableSlots({ type: "delivery", now: TUESDAY_MORNING });
  const last = slots.at(-1);

  assert.ok(last);
  assert.ok(
    last.date <= addDays("2026-09-15", FULFILLMENT.weeksAhead * 7),
    "geen momenten verder dan de horizon",
  );
});

test("datums worden in het Nederlands geschreven", () => {
  assert.equal(formatIsoDateLong("2026-09-17"), "donderdag 17 september");
  assert.equal(formatIsoDateLong("2026-12-25"), "vrijdag 25 december");
});
