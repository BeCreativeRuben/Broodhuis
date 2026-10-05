import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarClockIcon,
  ChevronLeftIcon,
  InfoIcon,
  LeafIcon,
  TruckIcon,
} from "lucide-react";

import { AllergenList } from "@/components/allergen-list";
import { AddToCart } from "@/components/cart/add-to-cart";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { addDays, currentIsoDate, formatIsoDateLong } from "@/lib/datetime";
import { formatEuro } from "@/lib/money";
import { FULFILLMENT, SHOP } from "@/lib/shop-config";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product niet gevonden" };

  return {
    title: product.name,
    description:
      product.description ??
      `${product.name} bestellen bij Bakkerij 't Broodhuis in ${SHOP.city}.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const earliestDate =
    product.leadTimeDays > 0
      ? addDays(currentIsoDate(), product.leadTimeDays)
      : null;

  return (
    <div className="page-shell py-6 lg:py-10">
      <Link
        href={`/assortiment?categorie=${product.category.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeftIcon className="size-4" />
        {product.category.name}
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-crumb shadow-warm-lg">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <Badge variant="secondary" className="rounded-full">
              {product.category.name}
            </Badge>
            <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
              {product.name}
            </h1>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-3xl font-semibold tabular-nums">
                {formatEuro(product.priceCents)}
              </span>
              <span className="text-sm text-muted-foreground">{product.unit}</span>
            </div>
            {product.description && (
              <p className="text-base text-muted-foreground">
                {product.description}
              </p>
            )}
          </div>

          {product.leadTimeDays > 0 && (
            <div className="flex gap-3 rounded-2xl border border-accent/60 bg-accent/25 p-4">
              <CalendarClockIcon className="mt-0.5 size-5 shrink-0 text-accent-foreground" />
              <div className="text-sm">
                <p className="font-medium">
                  Minstens {product.leadTimeDays} dagen vooraf bestellen
                </p>
                <p className="text-muted-foreground">
                  {earliestDate
                    ? `Het vroegste moment dat je kan kiezen is ${formatIsoDateLong(earliestDate)}.`
                    : null}
                </p>
              </div>
            </div>
          )}

          {product.trackStock && (
            <p className="text-sm">
              {product.inStock ? (
                <span className="font-medium">
                  Nog {product.stock} beschikbaar voor deze bakdag
                </span>
              ) : (
                <span className="font-medium text-destructive">
                  Momenteel uitverkocht
                </span>
              )}
            </p>
          )}

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
            variant="full"
          />

          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <p className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3">
              <TruckIcon className="mt-0.5 size-4 shrink-0" />
              Afhalen is gratis, leveren kost{" "}
              {formatEuro(FULFILLMENT.deliveryFeeCents)}
            </p>
            <p className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3">
              <InfoIcon className="mt-0.5 size-4 shrink-0" />
              Bestel tot {FULFILLMENT.orderCutoff.hour}u de dag ervoor
            </p>
          </div>

          <Separator />

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
              <LeafIcon className="size-4 text-crust" /> Ingrediënten
            </h2>
            <p className="text-sm text-muted-foreground">
              {product.ingredients ??
                "Vraag ons gerust naar de samenstelling van dit product."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">Allergenen</h2>
            <AllergenList codes={product.allergens} />
            <p className="text-xs text-muted-foreground">
              Alles gaat de deur uit vanuit de bakkerij, waar gluten, melk, eieren,
              noten en sesam gebruikt worden. Sporen zijn dus nooit helemaal uit te
              sluiten.
            </p>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-heading text-2xl font-semibold">
            Past hier goed bij
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
