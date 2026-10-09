"use client";

import Link from "next/link";
import { ShoppingBasketIcon, Trash2Icon } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { cartLineKey } from "@/lib/cart";
import { formatSelectionSummary } from "@/lib/cart-selection";
import { ProductImage } from "@/components/product-image";
import { QuantityStepper } from "@/components/quantity-stepper";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatEuro } from "@/lib/money";
import {
  formatCartCountLabel,
  formatQuantityLabel,
  isWeightPortionUnit,
  lineTotalCents,
} from "@/lib/weight";
import { FULFILLMENT } from "@/lib/shop-config";

export function CartSheet() {
  const {
    isOpen,
    closeCart,
    items,
    itemCount,
    subtotalCents,
    setQuantity,
    removeItem,
  } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? undefined : closeCart())}>
      <SheetContent
        side="right"
        className="data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="text-lg">Je winkelwagen</SheetTitle>
          <SheetDescription>
            {itemCount === 0
              ? "Nog niets in je wagen."
              : `${formatCartCountLabel(items)} — je kiest straks afhalen of leveren.`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-secondary">
              <ShoppingBasketIcon className="size-7 text-crust" />
            </div>
            <div className="space-y-1">
              <p className="font-heading text-base font-medium">
                Je winkelwagen is leeg
              </p>
              <p className="text-sm text-muted-foreground">
                Vers brood, koffiekoeken en gebak staan klaar in het assortiment.
              </p>
            </div>
            <ButtonLink
              href="/assortiment"
              onClick={closeCart}
              className="h-11 rounded-none px-6"
            >
              Naar het assortiment
            </ButtonLink>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-4">
              {items.map((line) => (
                <li key={cartLineKey(line)} className="flex gap-3 py-4">
                  <Link
                    href={`/product/${line.slug}`}
                    onClick={closeCart}
                    className="relative size-16 shrink-0 overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <ProductImage
                      src={line.imageUrl}
                      alt={line.name}
                      sizes="64px"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/product/${line.slug}`}
                          onClick={closeCart}
                          className="block truncate font-medium hover:underline"
                        >
                          {line.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {isWeightPortionUnit(line.unit)
                            ? `${formatQuantityLabel(line.quantity, line.unit)} · ${formatEuro(line.priceCents)} ${line.unit}`
                            : `${formatEuro(line.priceCents)} ${line.unit}`}
                        </p>
                        {formatSelectionSummary(line.selection) ? (
                          <p className="text-xs text-muted-foreground">
                            {formatSelectionSummary(line.selection)}
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 font-medium tabular-nums">
                        {formatEuro(
                          lineTotalCents(
                            line.priceCents,
                            line.quantity,
                            line.unit,
                          ),
                        )}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <QuantityStepper
                        value={line.quantity}
                        onChange={(next) => setQuantity(cartLineKey(line), next)}
                        min={1}
                        label={line.name}
                        formatValue={(value) =>
                          formatQuantityLabel(value, line.unit)
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-11 rounded-none text-muted-foreground"
                        onClick={() => removeItem(cartLineKey(line))}
                        aria-label={`${line.name} verwijderen`}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t border-border/50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotaal</span>
                <span className="font-medium tabular-nums">
                  {formatEuro(subtotalCents)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Afhalen is gratis. Leveren kost{" "}
                {formatEuro(FULFILLMENT.deliveryFeeCents)} extra.
              </p>
              <ButtonLink
                href="/afrekenen"
                onClick={closeCart}
                className="h-12 w-full rounded-none text-base"
              >
                Afrekenen
              </ButtonLink>
              <ButtonLink
                href="/winkelwagen"
                onClick={closeCart}
                variant="ghost"
                className="h-10 w-full rounded-none"
              >
                Winkelwagen bekijken
              </ButtonLink>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
