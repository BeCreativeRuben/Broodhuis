import type { Metadata } from "next";
import { ArrowRightIcon } from "lucide-react";

import { StartOrderLink } from "@/components/start-order-link";
import { formatEuro } from "@/lib/money";
import { FULFILLMENT, SHOP } from "@/lib/shop-config";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  description: `Plaats een bestelling of vraag levering aan bij ${SHOP.legalName} in ${SHOP.city}.`,
};

const steps = [
  {
    title: "Kies je producten",
    text: "In het assortiment. Allergenen en ingrediënten staan bij elk product.",
  },
  {
    title: "Afhalen of leveren",
    text: "Haal je bestelling op in de winkel, of laat ze thuis leveren op een vast moment.",
  },
  {
    title: "Betaal met Bancontact",
    text: "Je bestelling staat vast zodra de betaling gelukt is. Wij zetten ze klaar.",
  },
];

export default function HomePage() {
  return (
    <div className="page-shell py-10 lg:py-16">
      <header className="max-w-2xl space-y-5">
        <p className="eyebrow">{SHOP.tagline}</p>
        <h1 className="font-heading text-3xl leading-tight font-semibold sm:text-5xl sm:leading-[1.12]">
          Bestelling plaatsen
          <span className="mt-1 block font-normal text-crust sm:mt-2">
            of levering aanvragen
          </span>
        </h1>
        <p className="max-w-prose text-base text-muted-foreground sm:text-lg">
          Twee dingen. Je plaatst een bestelling en haalt af in de winkel, of je
          vraagt levering aan in {SHOP.city}. Betaal met Bancontact of KBC/CBC.
        </p>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row">
          <StartOrderLink
            intent="pickup"
            className="h-12 min-h-12 w-full rounded-none px-7 text-base sm:w-auto"
          >
            Bestelling plaatsen <ArrowRightIcon className="size-4" />
          </StartOrderLink>
          <StartOrderLink
            intent="delivery"
            className="h-12 min-h-12 w-full rounded-none px-7 text-base sm:w-auto"
          >
            Levering aanvragen <ArrowRightIcon className="size-4" />
          </StartOrderLink>
        </div>
      </header>

      <section className="mt-14 max-w-3xl lg:mt-20" aria-labelledby="hoe-werkt-het">
        <h2 id="hoe-werkt-het" className="font-heading text-2xl font-semibold">
          Hoe werkt het
        </h2>
        <ol className="mt-6 grid gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title}>
              <p className="eyebrow">Stap {index + 1}</p>
              <h3 className="mt-2 font-heading text-lg font-semibold">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 max-w-2xl lg:mt-20" aria-labelledby="praktisch">
        <h2 id="praktisch" className="font-heading text-2xl font-semibold">
          Praktisch
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {SHOP.street}, {SHOP.postalCode} {SHOP.city}.{" "}
          <a
            href={`tel:${SHOP.phoneHref}`}
            className="inline-flex min-h-12 items-center font-medium text-foreground underline-offset-4 hover:underline"
          >
            {SHOP.phone}
          </a>
        </p>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Afhalen kan van woensdag tot en met zondag in de voormiddag. Leveren
          doen we donderdagvoormiddag, vrijdagnamiddag en zondagvoormiddag, voor{" "}
          {formatEuro(FULFILLMENT.deliveryFeeCents)}. Bestel tot{" "}
          {FULFILLMENT.orderCutoff.hour}u de dag voordien.
        </p>
      </section>
    </div>
  );
}
