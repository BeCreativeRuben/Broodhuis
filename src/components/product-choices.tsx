"use client";

import { useMemo, useState } from "react";
import { CheckIcon, InfoIcon, LeafIcon, TruckIcon } from "lucide-react";

import { AllergenList } from "@/components/allergen-list";
import { AddToCart } from "@/components/cart/add-to-cart";
import { ProductImage } from "@/components/product-image";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { CatalogProduct } from "@/lib/catalog";
import { formatEuro } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  optionKeys,
  optionTitle,
  optionValues,
  variantMatching,
} from "@/lib/variants";

/**
 * Eén product met keuzes, zoals een taart met personen of deeg.
 * De groep is een radiolijst in dezelfde vorm als de momenten bij het afrekenen.
 */
export function ProductChoices({
  product,
  initialVariantId,
  earliestDateLabel,
  deliveryFeeLabel,
  cutoffHour,
}: {
  product: CatalogProduct;
  initialVariantId?: string;
  earliestDateLabel: string | null;
  deliveryFeeLabel: string;
  cutoffHour: number;
}) {
  const variants = product.variants;
  const [selectedId, setSelectedId] = useState(
    () => variants.find((variant) => variant.id === initialVariantId)?.id ?? variants[0]?.id,
  );
  const selected =
    variants.find((variant) => variant.id === selectedId) ?? variants[0];
  const keys = useMemo(() => optionKeys(variants), [variants]);

  if (!selected) return null;

  function choose(key: string, value: string) {
    const next = variantMatching(variants, selected, key, value);
    setSelectedId(next.id);
  }

  const image = selected.imageUrl ?? product.imageUrl;
  const detail = selected.description ?? product.description;

  return (
    <>
      <div className="relative aspect-4/3 overflow-hidden">
        <ProductImage
          src={image}
          alt={`${product.name}, ${selected.label}`}
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Badge variant="secondary">
            {product.category.displayName}
          </Badge>
          <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
            {product.name}
          </h1>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-3xl font-semibold tabular-nums">
              {formatEuro(selected.priceCents)}
            </span>
            <span className="text-sm text-muted-foreground">{selected.unit}</span>
          </div>
          {detail && <p className="text-base text-muted-foreground">{detail}</p>}
        </div>

        {keys.map((key) => (
          <fieldset key={key}>
            <legend className="font-heading text-lg font-semibold">
              {optionTitle(key)}
            </legend>
            <div role="radiogroup" aria-label={optionTitle(key)} className="mt-3 space-y-2">
              {optionValues(variants, key).map((value) => (
                <ChoiceRow
                  key={value}
                  name={key}
                  value={value}
                  checked={selected.options[key] === value}
                  onSelect={() => choose(key, value)}
                />
              ))}
            </div>
          </fieldset>
        ))}

        {product.leadTimeDays > 0 && (
          <p className="text-sm text-muted-foreground">
            Minstens {product.leadTimeDays} dagen vooraf bestellen
            {earliestDateLabel ? `. Het vroegste moment is ${earliestDateLabel}.` : "."}
          </p>
        )}

        <AddToCart
          product={{
            id: product.id,
            variantId: selected.id,
            slug: product.slug,
            name: `${product.name} — ${selected.label}`,
            priceCents: selected.priceCents,
            unit: selected.unit,
            imageUrl: image,
            inStock: product.inStock,
            stock: product.stock,
            trackStock: product.trackStock,
          }}
          variant="full"
        />

        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3">
            <TruckIcon className="mt-0.5 size-4 shrink-0" />
            Afhalen is gratis, leveren kost {deliveryFeeLabel}
          </p>
          <p className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3">
            <InfoIcon className="mt-0.5 size-4 shrink-0" />
            Bestel tot {cutoffHour}u de dag ervoor
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
    </>
  );
}

function ChoiceRow({
  name,
  value,
  checked,
  onSelect,
}: {
  name: string;
  value: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
        checked ? "border-primary bg-accent/25" : "border-border hover:bg-secondary/50",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
          checked ? "border-primary bg-primary" : "border-input",
        )}
      >
        {checked && <CheckIcon className="size-3 text-primary-foreground" />}
      </span>
      <span className="font-medium">{value}</span>
    </label>
  );
}
