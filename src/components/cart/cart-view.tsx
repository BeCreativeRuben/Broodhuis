"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  InfoIcon,
  ShoppingBasketIcon,
  Trash2Icon,
  TruckIcon,
} from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { ProductImage } from "@/components/product-image";
import { QuantityStepper } from "@/components/quantity-stepper";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEuro } from "@/lib/money";
import { formatQuantityLabel } from "@/lib/weight";
import { cn } from "@/lib/utils";
import { cartLineKey, type CartNotice } from "@/lib/cart";
import { revalidateCart } from "@/server/actions/cart";

export function CartView({ deliveryFeeCents }: { deliveryFeeCents: number }) {
  const { items, itemCount, subtotalCents, setQuantity, removeItem, isReady } =
    useCart();
  const [notices, setNotices] = useState<CartNotice[]>([]);
  const [isChecking, startChecking] = useTransition();
  const lastSyncedRef = useRef<string>("");

  // Winkelwagen nakijken bij de server: bestaan de producten nog, is er
  // voorraad, klopt de prijs? Correcties passen we meteen toe.
  useEffect(() => {
    if (!isReady) return;

    const signature = items
      .map((line) => `${cartLineKey(line)}:${line.quantity}`)
      .sort()
      .join("|");
    if (signature === lastSyncedRef.current) return;
    lastSyncedRef.current = signature;

    if (items.length === 0) {
      setNotices([]);
      return;
    }

    startChecking(async () => {
      const priced = await revalidateCart(
        items.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          quantity: line.quantity,
        })),
      );

      setNotices(priced.notices);

      const pricedById = new Map(
        priced.lines.map((line) => [cartLineKey(line), line]),
      );
      for (const line of items) {
        const server = pricedById.get(cartLineKey(line));
        if (!server) {
          removeItem(cartLineKey(line));
        } else if (server.quantity !== line.quantity) {
          setQuantity(cartLineKey(line), server.quantity);
        }
      }
    });
  }, [items, isReady, removeItem, setQuantity]);

  if (!isReady) {
    return (
      <div className="mt-8 space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-10 rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary">
          <ShoppingBasketIcon className="size-7 text-crust" />
        </div>
        <h2 className="mt-4 font-heading text-xl font-semibold">
          Je winkelwagen is leeg
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Kies je brood, koffiekoeken of gebak in het assortiment. Je kiest daarna
          zelf of je afhaalt of laat leveren.
        </p>
        <ButtonLink
          href="/assortiment"
          className="mt-5 h-12 rounded-none px-6 text-base"
        >
          Naar het assortiment
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="space-y-4">
        {notices.length > 0 && (
          <div className="space-y-2">
            {notices.map((notice) => (
              <Alert
                key={notice.message}
                variant="default"
                className="bg-accent/25"
              >
                <InfoIcon />
                <AlertDescription>{notice.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        <ul className="divide-y divide-border overflow-hidden border border-border bg-card">
          {items.map((line) => (
            <li key={cartLineKey(line)} className="flex gap-4 p-4">
              <Link
                href={`/product/${line.slug}`}
                className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-secondary sm:size-24"
              >
                <ProductImage src={line.imageUrl} alt={line.name} sizes="96px" />
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/product/${line.slug}`}
                      className="font-heading text-base font-semibold hover:underline"
                    >
                      {line.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatEuro(line.priceCents)} {line.unit}
                      {line.quantity > 1
                        ? ` · ${formatQuantityLabel(line.quantity, line.unit)}`
                        : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-heading text-base font-semibold tabular-nums">
                    {formatEuro(line.priceCents * line.quantity)}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <QuantityStepper
                    value={line.quantity}
                    onChange={(next) => setQuantity(cartLineKey(line), next)}
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

        <ButtonLink href="/assortiment" variant="ghost" className="rounded-none">
          Verder winkelen
        </ButtonLink>
      </div>

      <aside className="lg:sticky lg:top-32">
        <div className="space-y-4 border border-border bg-card p-5 shadow-warm">
          <h2 className="font-heading text-lg font-semibold">Overzicht</h2>

          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">
                {itemCount} {itemCount === 1 ? "stuk" : "stuks"}
              </dt>
              <dd className="font-medium tabular-nums">
                {formatEuro(subtotalCents)}
              </dd>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <dt>Levering (optioneel)</dt>
              <dd className="tabular-nums">+ {formatEuro(deliveryFeeCents)}</dd>
            </div>
          </dl>

          <p className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
            <TruckIcon className="mt-0.5 size-3.5 shrink-0" />
            Bij het afrekenen kies je afhalen (gratis) of leveren. Daar zie je ook
            de beschikbare momenten.
          </p>

          <ButtonLink
            href="/afrekenen"
            aria-disabled={isChecking || undefined}
            className={cn(
              "h-12 w-full rounded-none text-base",
              isChecking && "pointer-events-none opacity-70",
            )}
          >
            Verder naar afrekenen <ArrowRightIcon className="size-4" />
          </ButtonLink>
        </div>
      </aside>
    </div>
  );
}
