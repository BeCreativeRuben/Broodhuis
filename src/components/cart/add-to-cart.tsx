"use client";

import { useState } from "react";
import { CheckIcon, ShoppingBasketIcon } from "lucide-react";
import { toast } from "sonner";

import { QuantityStepper } from "@/components/quantity-stepper";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import type { CatalogProduct } from "@/lib/catalog";
import { cn } from "@/lib/utils";

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
        priceCents: product.priceCents,
        unit: product.unit,
        imageUrl: product.imageUrl,
      },
      quantity,
    );

    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);

    toast.success(
      quantity === 1
        ? `${product.name} in je winkelwagen`
        : `${quantity} × ${product.name} in je winkelwagen`,
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
        className={cn("h-11 w-full rounded-full", className)}
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
        className={cn("h-11 w-full rounded-full text-sm", className)}
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
    <div
      className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}
    >
      <QuantityStepper
        value={quantity}
        onChange={(next) => setQuantity(Math.max(1, next))}
        label={product.name}
        max={maxQuantity}
        size="lg"
        className="self-start"
      />
      <Button
        type="button"
        onClick={handleAdd}
        size="lg"
        className="h-12 flex-1 rounded-full text-base"
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
  );
}
