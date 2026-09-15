"use client";

import { usePathname } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { ButtonLink } from "@/components/ui/button-link";
import { formatEuro } from "@/lib/money";

/**
 * Vaste balk onderaan op gsm. Van Hoorick laat je op mobiel zoeken naar de
 * winkelwagen; hier staat het totaal en de volgende stap altijd binnen bereik
 * van je duim.
 */
export function MobileCartBar() {
  const { itemCount, subtotalCents, isReady } = useCart();
  const pathname = usePathname();

  const hiddenOn = ["/winkelwagen", "/afrekenen", "/betaling", "/bestelling"];
  const isHidden = hiddenOn.some((path) => pathname.startsWith(path));

  if (!isReady || itemCount === 0 || isHidden) return null;

  return (
    <>
      {/* Ruimte onderaan de pagina zodat de vaste balk de voettekst niet bedekt */}
      <div aria-hidden className="h-24 lg:hidden" />
      <div className="print-hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-warm-lg backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">
              {itemCount} {itemCount === 1 ? "stuk" : "stuks"} in je winkelwagen
            </p>
            <p className="font-heading text-lg leading-tight font-semibold tabular-nums">
              {formatEuro(subtotalCents)}
            </p>
          </div>
          <ButtonLink
            href="/afrekenen"
            className="h-12 shrink-0 rounded-full px-5 text-base"
          >
            Afrekenen <ArrowRightIcon className="size-4" />
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
