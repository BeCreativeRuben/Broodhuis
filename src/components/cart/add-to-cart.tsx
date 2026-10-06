"use client";

import { useState } from "react";
import { CheckIcon, ShoppingBasketIcon } from "lucide-react";
import { toast } from "sonner";

import { QuantityStepper } from "@/components/quantity-stepper";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import type { CatalogProduct } from "@/lib/catalog";
import { formatEuro } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  formatQuantityLabel,
  isPerKgUnit,
  portionUnit,
  portionUnitPriceCents,
} from "@/lib/weight";

type AddToCartProps = {
  product: Pick<
    CatalogProduct,
    "id" | "slug" | "name" | "priceCents" | "unit" | "imageUrl" | "inStock"
  > & { stock?: number; trackStock?: boolean; variantId?: string };
  /** "compact" = één knop in een productkaart, "full" = met aantalkiezer */
  variant?: "compact" | "full";
  className?: string;
};

export function AddToCart({
  product,
  variant = "compact",
  className,
}: AddToCartProps) {
  const { addItem, openCart, quantityOf } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const maxQuantity =
    product.trackStock && typeof product.stock === "number" ? product.stock : null;
  const inCart = quantityOf(product.id, product.variantId);

  function handleAdd() {
    addItem(
      {
        productId: product.id,
        variantId: product.variantId,
        slug: product.slug,
        name: product.name,
        priceCents: portionUnitPriceCents(product.priceCents, product.unit),
        unit: portionUnit(product.unit),
        imageUrl: product.imageUrl,
      },
      quantity,
    );

    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);

    const addedLabel = isPerKgUnit(product.unit)
      ? `${formatQuantityLabel(quantity, product.unit)} ${product.name}`
      : quantity === 1
        ? product.name
        : `${quantity} × ${product.name}`;
    toast.success(`${addedLabel} in je winkelwagen`,
      {
        action: { label: "Bekijken", onClick: openCart },
      },
    );
  }

  if (!product.inStock) {
    return (
      <Button
        disabled
        variant="secondary"
        className={cn("h-11 w-full rounded-none", className)}
      >
        Uitverkocht
      </Button>
    );
  }

  if (variant === "compact") {
    return (
      <Button
        type="button"
        onClick={handleAdd}
        className={cn("h-11 w-full rounded-none text-sm", className)}
      >
        {justAdded ? (
          <>
            <CheckIcon className="size-4" /> Toegevoegd
          </>
        ) : (
          <>
            <ShoppingBasketIcon className="size-4" />
            {inCart > 0 ? `Nog een (${inCart} in wagen)` : "In winkelwagen"}
          </>
        )}
      </Button>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <QuantityStepper
          value={quantity}
          onChange={(next) => setQuantity(Math.max(1, next))}
          label={product.name}
          max={maxQuantity}
          size="lg"
          className="self-start"
          formatValue={
            isPerKgUnit(product.unit)
              ? (value) => formatQuantityLabel(value, product.unit)
              : undefined
          }
        />
        <Button
          type="button"
          onClick={handleAdd}
          size="lg"
          className="h-12 flex-1 rounded-none text-base"
        >
          {justAdded ? (
            <>
              <CheckIcon className="size-5" /> Toegevoegd
            </>
          ) : (
            <>
              <ShoppingBasketIcon className="size-5" /> In winkelwagen
            </>
          )}
        </Button>
      </div>
      {isPerKgUnit(product.unit) && (
        <p className="text-sm text-muted-foreground">
          {formatEuro(
            portionUnitPriceCents(product.priceCents, product.unit) * quantity,
          )}{" "}
          voor {formatQuantityLabel(quantity, product.unit)}
        </p>
      )}
    </div>
  );
}
