"use server";

import { priceCart } from "@/lib/cart-pricing";
import type { CartItem, PricedCart } from "@/lib/cart";

/**
 * De browser stuurt zijn winkelwagen op, de server rekent hem opnieuw door.
 * Zo zie je meteen als een product uitverkocht is of van prijs veranderde,
 * nog voor je begint af te rekenen.
 */
export async function revalidateCart(
  items: Array<Pick<CartItem, "productId" | "variantId" | "quantity" | "selection">>,
): Promise<PricedCart> {
  return priceCart(items);
}
