import Link from "next/link";
import { CalendarClockIcon } from "lucide-react";

import { AddToCart } from "@/components/cart/add-to-cart";
import { ProductImage } from "@/components/product-image";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { allergenSummary } from "@/lib/allergens";
import type { CatalogProduct } from "@/lib/catalog";
import { formatEuro } from "@/lib/money";

export function ProductCard({
  product,
  priority = false,
}: {
  product: CatalogProduct;
  priority?: boolean;
}) {
  const allergens = allergenSummary(product.allergens.join(","));

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-warm transition-shadow hover:shadow-warm-lg">
      <Link
        href={`/product/${product.slug}`}
        className="relative aspect-4/3 overflow-hidden bg-secondary"
      >
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          priority={priority}
          className="transition-transform duration-500 group-hover:scale-105"
        />
        {product.leadTimeDays > 0 && (
          <Badge className="absolute top-3 left-3 gap-1 border-transparent bg-card/95 text-foreground shadow-warm backdrop-blur">
            <CalendarClockIcon className="size-3" />
            {product.leadTimeDays} dagen vooraf
          </Badge>
        )}
        {!product.inStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70 font-heading text-lg font-semibold">
            Uitverkocht
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1 space-y-1">
          <h3 className="font-heading text-lg leading-tight font-semibold">
            <Link href={`/product/${product.slug}`} className="hover:underline">
              {product.name}
            </Link>
          </h3>
          {product.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {product.description}
            </p>
          )}
          {allergens && (
            <p className="text-xs text-muted-foreground">Bevat: {allergens}</p>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <span className="font-heading text-xl font-semibold tabular-nums">
            {formatEuro(product.priceCents)}
          </span>
          <span className="text-xs text-muted-foreground">{product.unit}</span>
        </div>

        {product.trackStock && product.inStock && product.stock <= 6 && (
          <p className="text-xs font-medium text-warning-foreground">
            Nog {product.stock} beschikbaar
          </p>
        )}

        {product.variants.length > 0 ? (
          <ButtonLink
            href={`/product/${product.slug}`}
            className="h-11 w-full rounded-full text-sm"
          >
            Kies een smaak
          </ButtonLink>
        ) : (
          <AddToCart
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              priceCents: product.priceCents,
              unit: product.unit,
              imageUrl: product.imageUrl,
              inStock: product.inStock,
              stock: product.stock,
              trackStock: product.trackStock,
            }}
          />
        )}
      </div>
    </article>
  );
}
