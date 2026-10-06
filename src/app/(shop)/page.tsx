import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  BanknoteIcon,
  ClockIcon,
  CroissantIcon,
  ShoppingBasketIcon,
  StoreIcon,
  TruckIcon,
} from "lucide-react";

import { CategoryIcon } from "@/components/category-icon";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { ButtonLink } from "@/components/ui/button-link";
import { capitalizeFirst } from "@/lib/datetime";
import { getCatalogGroups, getFeaturedProducts } from "@/lib/catalog";
import { formatEuro } from "@/lib/money";
import { FULFILLMENT, SHOP } from "@/lib/shop-config";
import { getClosedDates } from "@/lib/settings";
import { getAvailableSlots } from "@/lib/slots";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const steps = [
  {
    icon: ShoppingBasketIcon,
    title: "Kies je producten",
    text: "Van wit brood tot een feesttaart. Allergenen en ingrediënten staan bij elk product.",
  },
  {
    icon: StoreIcon,
    title: "Afhalen of leveren",
    text: "Haal je bestelling op in de winkel, of laat ze thuis leveren op een vast moment.",
  },
  {
    icon: BanknoteIcon,
    title: "Betaal met Bancontact",
    text: "Je bestelling staat vast zodra de betaling gelukt is. Wij zetten ze klaar.",
  },
];

export default async function HomePage() {
  const [featured, categories, closedDates] = await Promise.all([
    getFeaturedProducts(4),
    getCatalogGroups(),
    getClosedDates(),
  ]);

  const nextDeliverySlots = getAvailableSlots({
    type: "delivery",
    closedDates,
  }).slice(0, 3);
  const nextPickupSlot = getAvailableSlots({ type: "pickup", closedDates })[0];

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="page-shell grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-16 lg:py-16">
          <div className="space-y-6">
            <p className="eyebrow">{SHOP.tagline}</p>
            <h1 className="font-heading text-4xl leading-[1.15] sm:text-5xl lg:text-[3.4rem]">
              Dagvers brood &amp; banket,
              <br />
              <em className="text-crust not-italic">met liefde gebakken</em>
            </h1>
            <p className="max-w-prose text-base text-muted-foreground sm:text-lg">
              Sinds augustus 2020 dé warme bakker van {SHOP.city} voor brood, gebak,
              confiserie en belegde broodjes. Bestel online, betaal met Bancontact
              en haal af of laat leveren.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                href="/assortiment"
                size="lg"
                className="h-12 rounded-none px-7 text-base"
              >
                Beginnen met bestellen <ArrowRightIcon className="size-4" />
              </ButtonLink>
              <ButtonLink
                href="/info"
                variant="outline"
                size="lg"
                className="h-12 rounded-none px-7 text-base"
              >
                Hoe werkt het?
              </ButtonLink>
            </div>

            <dl className="grid gap-3 pt-2 sm:grid-cols-3">
              <div className="border border-border/80 bg-card/70 p-3">
                <dt className="text-xs text-muted-foreground">Afhalen</dt>
                <dd className="text-sm font-medium">
                  {nextPickupSlot
                    ? `Eerstvolgend: ${nextPickupSlot.dateLabelShort}`
                    : "Woensdag t.e.m. zondag"}
                </dd>
              </div>
              <div className="border border-border/80 bg-card/70 p-3">
                <dt className="text-xs text-muted-foreground">Leveren</dt>
                <dd className="text-sm font-medium">
                  do · vr · zo — {formatEuro(FULFILLMENT.deliveryFeeCents)}
                </dd>
              </div>
              <div className="border border-border/80 bg-card/70 p-3">
                <dt className="text-xs text-muted-foreground">Betalen</dt>
                <dd className="text-sm font-medium">Bancontact of bankkaart</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <div className="relative aspect-4/3 overflow-hidden bg-crumb">
              <ProductImage
                src="/images/bakkerij-hero.jpg"
                alt="Vers brood op de rekken van bakkerij 't Broodhuis"
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
            <div className="absolute -bottom-4 left-4 flex items-center gap-3 border border-border bg-card px-4 py-3 shadow-warm sm:left-6">
              <span className="flex size-10 items-center justify-center bg-accent text-accent-foreground">
                <CroissantIcon className="size-5" />
              </span>
              <div className="text-sm leading-tight">
                <p className="font-medium">Elke bakdag versgebakken</p>
                <p className="text-muted-foreground">Nooit van de dag voordien</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 border-y border-border bg-secondary/40">
        <p className="page-shell flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3 text-center text-[13px] tracking-wide text-foreground/80 uppercase">
          <span>brood &amp; patisserie</span>
          <span aria-hidden className="hidden text-crust sm:inline">
            ·
          </span>
          <span>belegde broodjes</span>
          <span aria-hidden className="hidden text-crust sm:inline">
            ·
          </span>
          <span>feesttaarten</span>
          <span aria-hidden className="hidden text-crust sm:inline">
            ·
          </span>
          <span>online bestellen</span>
        </p>
      </div>

      <section className="page-shell py-12 lg:py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="border border-border bg-card p-5 shadow-warm"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-crust">
                  <step.icon className="size-5" />
                </span>
                <span className="font-heading text-sm font-semibold text-muted-foreground">
                  Stap {index + 1}
                </span>
              </div>
              <h2 className="mt-3 font-heading text-lg font-semibold">
                {step.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell pb-12 lg:pb-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Assortiment</p>
            <h2 className="font-heading text-2xl font-semibold sm:text-3xl">
              Waar heb je vandaag zin in?
            </h2>
          </div>
          <ButtonLink
            href="/assortiment"
            variant="ghost"
            className="min-h-11 rounded-none"
          >
            Beginnen met bestellen <ArrowRightIcon className="size-4" />
          </ButtonLink>
        </div>

        <div className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/assortiment?categorie=${category.slug}`}
              className="min-w-[45%] snap-start border border-border bg-card p-4 shadow-warm transition-colors hover:bg-secondary/60 sm:min-w-0"
            >
              <CategoryIcon
                category={{ slug: category.slug, name: category.name }}
                className="size-6 text-crust"
              />
              <p className="mt-2 font-heading text-base font-semibold">
                {category.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {category.productCount}{" "}
                {category.productCount === 1 ? "product" : "producten"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="page-shell pb-12 lg:pb-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Onze klassiekers</p>
              <h2 className="font-heading text-2xl font-semibold sm:text-3xl">
                Het meest besteld
              </h2>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index === 0}
              />
            ))}
          </div>
        </section>
      )}

      <section className="page-shell pb-16">
        <div className="grid gap-4 border border-border bg-card p-6 shadow-warm sm:grid-cols-2 lg:p-8">
          <div className="space-y-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <TruckIcon className="size-5" />
            </span>
            <h2 className="font-heading text-xl font-semibold">
              Leveren doen we op vaste momenten
            </h2>
            <p className="text-sm text-muted-foreground">
              Zo blijft alles vers en rijden we efficiënt rond in {SHOP.city}:
              donderdagvoormiddag, vrijdagnamiddag en zondagvoormiddag. Een levering
              kost {formatEuro(FULFILLMENT.deliveryFeeCents)}.
            </p>
            <ul className="space-y-1.5 text-sm">
              {nextDeliverySlots.map((slot) => (
                <li key={slot.value} className="flex items-center gap-2">
                  <ClockIcon className="size-4 shrink-0 text-crust" />
                  <span>{capitalizeFirst(slot.dateLabel)}</span>
                  <span className="text-muted-foreground">{slot.timeLabel}</span>
                </li>
              ))}
              {nextDeliverySlots.length === 0 && (
                <li className="text-muted-foreground">
                  Momenteel geen leveringsmomenten beschikbaar — bel ons op{" "}
                  {SHOP.phone}.
                </li>
              )}
            </ul>
          </div>

          <div className="space-y-3 bg-secondary/60 p-5">
            <span className="flex size-10 items-center justify-center rounded-full bg-card text-crust">
              <StoreIcon className="size-5" />
            </span>
            <h2 className="font-heading text-xl font-semibold">
              Afhalen in de winkel
            </h2>
            <p className="text-sm text-muted-foreground">
              {SHOP.street}, {SHOP.postalCode} {SHOP.city}. Afhalen kan van woensdag
              tot en met zondag in de voormiddag. Je krijgt je moment te zien bij
              het afrekenen.
            </p>
            <p className="text-sm text-muted-foreground">
              Bestel tot {FULFILLMENT.orderCutoff.hour}u de dag vóór je afhaalt of
              laat leveren.
            </p>
            <ButtonLink href="/assortiment" className="h-11 rounded-none">
              Beginnen met bestellen
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
