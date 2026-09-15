"use client";

import { useEffect } from "react";

import { useCart } from "@/components/cart/cart-provider";

/**
 * Maakt de winkelwagen leeg zodra een bestelling betaald is. Bewust niet
 * eerder: als een betaling mislukt, moet de klant nog met dezelfde wagen
 * opnieuw kunnen proberen.
 */
export function ClearCart() {
  const { clear, isReady, items } = useCart();

  useEffect(() => {
    if (isReady && items.length > 0) clear();
  }, [isReady, items.length, clear]);

  return null;
}
