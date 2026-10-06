import type { AllergenCode } from "@/lib/allergens";
import { selectionKey, type CartSelection } from "@/lib/cart-selection";

export type { CartSelection };

/**
 * Types en constanten van de winkelwagen. Dit bestand is bewust vrij van
 * database-imports, zodat zowel de browser als de server het kan gebruiken.
 * Het doorrekenen zelf gebeurt in src/lib/cart-pricing.ts (server-only).
 */

/** Wat de browser bewaart: id en aantal, plus een snapshot voor snelle weergave. */
export type CartItem = {
  productId: string;
  /** Gekozen variant, bv. een theesmaak. Leeg bij een product zonder keuze. */
  variantId?: string;
  quantity: number;
  name: string;
  slug: string;
  priceCents: number;
  unit: string;
  imageUrl: string | null;
  /** Opschrift, personen, deeg of fototaart — geen prijswijziging. */
  selection?: CartSelection;
};

/** Twee smaken of opschriften van hetzelfde product zijn twee lijnen. */
export function cartLineKey(item: {
  productId: string;
  variantId?: string | null;
  selection?: CartSelection | null;
}): string {
  const base = item.variantId ? `${item.productId}:${item.variantId}` : item.productId;
  const extra = selectionKey(item.selection);
  return extra ? `${base}:${extra}` : base;
}

export const MAX_QUANTITY_PER_LINE = 40;

export type PricedLine = {
  productId: string;
  variantId?: string;
  variantLabel: string | null;
  slug: string;
  name: string;
  unit: string;
  imageUrl: string | null;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  allergens: AllergenCode[];
  leadTimeDays: number;
  /** null = onbeperkt beschikbaar */
  maxQuantity: number | null;
  photoUrl: string | null;
  selection?: CartSelection;
};

export type CartNotice = {
  kind: "removed" | "adjusted" | "price";
  message: string;
};

export type PricedCart = {
  lines: PricedLine[];
  notices: CartNotice[];
  subtotalCents: number;
  itemCount: number;
  /** Langste bestelperiode in de winkelwagen, bepaalt de vroegste datum. */
  maxLeadTimeDays: number;
  /** Product met de langste bestelperiode, voor de uitleg in de checkout. */
  leadTimeProductName: string | null;
};

export const EMPTY_CART: PricedCart = {
  lines: [],
  notices: [],
  subtotalCents: 0,
  itemCount: 0,
  maxLeadTimeDays: 0,
  leadTimeProductName: null,
};
