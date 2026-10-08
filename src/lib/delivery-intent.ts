import type { FulfillmentType } from "@/lib/shop-config";

/**
 * De startpagina zet deze cookie via /bestellen?levering=1 (of =0).
 * De kassa leest ze één keer en kiest dan afhalen of leveren.
 * Niet httpOnly: de checkout is een clientcomponent en wist de cookie
 * zodra de keuze in het formulier staat, zodat een latere tik niet
 * overschreven wordt.
 */
export const FULFILLMENT_INTENT_COOKIE = "broodhuis-bezorging";

export function fulfillmentIntentFromCookie(
  value: string | undefined | null,
): FulfillmentType | null {
  if (value === "pickup" || value === "delivery") return value;
  return null;
}
