import type { Metadata } from "next";
import Image from "next/image";
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
    <>
      <section className="relative isolate overflow-hidden">
        <Image
          src="/images/bakkerij-hero.jpg"
          alt="Vers brood op de rekken van bakkerij 't Broodhuis"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Donker genoeg achter de tekst voor WCAG AA; de foto blijft rechts en onderaan zichtbaar. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,19,19,0.68)_0%,rgba(18,19,19,0.62)_72%,rgba(18,19,19,0.22)_100%)] sm:bg-[linear-gradient(90deg,rgba(18,19,19,0.72)_0%,rgba(18,19,19,0.66)_52%,rgba(18,19,19,0.2)_78%,rgba(18,19,19,0.05)_100%)]"
        />
        <div className="relative page-shell flex min-h-[30rem] items-start py-7 sm:min-h-[36rem] sm:items-center sm:py-16 lg:min-h-[42rem] lg:py-20">
          <div className="max-w-xl space-y-4">
            <p className="text-[0.7rem] font-medium tracking-[0.16em] text-[#fffcf6] uppercase">
              {SHOP.tagline}
            </p>
            <h1 className="font-heading text-3xl leading-tight font-semibold text-[#fffcf6] sm:text-5xl sm:leading-[1.12]">
              Bestelling plaatsen
              <span className="mt-1 block font-normal text-[#ece8de] sm:mt-2">
                of levering aanvragen
              </span>
            </h1>
            <p className="max-w-prose text-base leading-relaxed text-[#fffcf6] sm:text-lg">
              Plaats je bestelling en haal ze af in de winkel, of vraag levering
              aan in {SHOP.city}.
            </p>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row">
              <StartOrderLink
                intent="pickup"
                className="h-12 min-h-12 w-full rounded-none border-transparent bg-background px-7 text-base text-foreground shadow-none hover:bg-background/90 sm:w-auto"
              >
                Bestelling plaatsen <ArrowRightIcon className="size-4" />
              </StartOrderLink>
              <StartOrderLink
                intent="delivery"
                className="h-12 min-h-12 w-full rounded-none border-transparent bg-secondary px-7 text-base text-secondary-foreground shadow-none hover:bg-secondary/90 sm:w-auto"
              >
                Levering aanvragen <ArrowRightIcon className="size-4" />
              </StartOrderLink>
            </div>
          </div>
        </div>
      </section>

      <div className="page-shell bg-background py-12 lg:py-16">
        <section className="max-w-3xl" aria-labelledby="hoe-werkt-het">
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
    </>
  );
}
