"use client";

import { ShoppingBasketIcon } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { formatEuro } from "@/lib/money";
import { formatCartCountLabel } from "@/lib/weight";
import { cn } from "@/lib/utils";

export function CartButton({ className }: { className?: string }) {
  const { items, itemCount, subtotalCents, openCart, isReady } = useCart();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={openCart}
      className={cn("relative h-12 min-h-12 gap-2 rounded-none pr-4 pl-3", className)}
      aria-label={
        itemCount > 0
          ? `Winkelwagen openen, ${formatCartCountLabel(items)}, ${formatEuro(subtotalCents)}`
          : "Winkelwagen openen"
      }
    >
      <span className="relative">
        <ShoppingBasketIcon className="size-5" />
        {isReady && itemCount > 0 && (
          <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground tabular-nums">
            {itemCount > 99 ? "99" : itemCount}
          </span>
        )}
      </span>
      <span className="hidden font-medium tabular-nums sm:inline">
        {isReady && itemCount > 0 ? formatEuro(subtotalCents) : "Winkelwagen"}
      </span>
    </Button>
  );
}
