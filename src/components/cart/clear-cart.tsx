"use client";

import { useEffect } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { clearCheckoutDraft } from "@/components/checkout/checkout-draft";

/**
 * Maakt de winkelwagen en het ingevulde afrekenformulier leeg zodra een
 * bestelling betaald is. Bewust niet eerder: als een betaling mislukt, moet de
 * klant met dezelfde wagen en dezelfde gegevens opnieuw kunnen proberen.
 */
export function ClearCart() {
  const { clear, isReady, items } = useCart();

  useEffect(() => {
    if (isReady && items.length > 0) clear();
  }, [isReady, items.length, clear]);

  useEffect(() => {
    clearCheckoutDraft();
  }, []);

  return null;
}
