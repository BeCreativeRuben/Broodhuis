import type { Metadata } from "next";
import {
  BanknoteIcon,
  CakeSliceIcon,
  ClockIcon,
  CroissantIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  StoreIcon,
  TruckIcon,
} from "lucide-react";

import { AllergenReference } from "@/components/allergen-list";
import { ButtonLink } from "@/components/ui/button-link";
import { formatTime, WEEKDAY_NAMES_NL } from "@/lib/datetime";
import { formatEuro } from "@/lib/money";
import { FULFILLMENT, SHOP } from "@/lib/shop-config";

export const metadata: Metadata = {
  title: "Praktisch",
  description:
    "Hoe online bestellen werkt bij Bakkerij 't Broodhuis: afhalen of leveren, betalen met Bancontact, allergenen en feesttaarten.",
  alternates: { canonical: "/info" },
};

export default function InfoPage() {
  const mapsQuery = encodeURIComponent(
    `${SHOP.legalName}, ${SHOP.street}, ${SHOP.postalCode} ${SHOP.city}`,
  );

  return (
    <div className="page-shell py-8 lg:py-12">
      <header className="max-w-2xl space-y-3">
        <p className="eyebrow">Praktisch</p>
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
          Zo werkt online bestellen
        </h1>
        <p className="text-muted-foreground">
          Je kiest je producten, je moment en je betaalt meteen online. Daarna
          bakken wij en zetten we alles klaar. Simpel als dat.
        </p>
      </header>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <section className="border border-border bg-card p-6">
          <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-crust">
            <StoreIcon className="size-5" />
          </span>
          <h2 className="mt-3 font-heading text-xl font-semibold">
            Afhalen in de winkel
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Afhalen is gratis. Je kiest bij het afrekenen een voormiddag die past;
            wij zetten je bestelling op naam klaar.
          </p>

          <ul className="mt-4 space-y-1.5 text-sm">
            {FULFILLMENT.pickupWindows.map((serviceWindow) => (
              <li
                key={serviceWindow.id}
                className="flex items-center justify-between gap-4 border-b border-border/60 pb-1.5 last:border-0"
              >
                <span className="capitalize">
                  {WEEKDAY_NAMES_NL[serviceWindow.weekday]}
                </span>
                <span className="tabular-nums">
                  {formatTime(serviceWindow.start)} -{" "}
                  {formatTime(serviceWindow.end)}
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-4 text-muted-foreground">
              <span>maandag &amp; dinsdag</span>
              <span>gesloten</span>
            </li>
          </ul>

          <address className="mt-4 text-sm not-italic">
            <span className="flex items-start gap-2">
              <MapPinIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>
                {SHOP.street}
                <br />
                {SHOP.postalCode} {SHOP.city}
              </span>
            </span>
          </address>

          <ButtonLink
            href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
            target="_blank"
            rel="noreferrer"
            variant="outline"
            className="mt-4 min-h-11 rounded-none"
          >
            Route naar de winkel
          </ButtonLink>
        </section>

        <section className="border border-border bg-card p-6">
          <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <TruckIcon className="size-5" />
          </span>
          <h2 className="mt-3 font-heading text-xl font-semibold">
            Leveren aan huis
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Wij leveren op drie vaste momenten per week. Zo blijft alles vers en
            rijden we één ronde per keer.
          </p>

          <ul className="mt-4 space-y-1.5 text-sm">
            {FULFILLMENT.deliveryWindows.map((serviceWindow) => (
              <li
                key={serviceWindow.id}
                className="flex items-center justify-between gap-4 border-b border-border/60 pb-1.5 last:border-0"
              >
                <span className="capitalize">
                  {WEEKDAY_NAMES_NL[serviceWindow.weekday]} —{" "}
                  {serviceWindow.label.toLowerCase()}
                </span>
                <span className="tabular-nums">
                  {formatTime(serviceWindow.start)} -{" "}
                  {formatTime(serviceWindow.end)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 rounded-xl bg-secondary/60 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Leveringskost</dt>
              <dd className="font-medium">
                {formatEuro(FULFILLMENT.deliveryFeeCents)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Leveringsgebied</dt>
              <dd className="font-medium">
                postcode {FULFILLMENT.deliveryPostalCodes.join(", ")}
              </dd>
            </div>
            {FULFILLMENT.deliveryMinimumCents > 0 && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Minimumbedrag</dt>
                <dd className="font-medium">
                  {formatEuro(FULFILLMENT.deliveryMinimumCents)}
                </dd>
              </div>
            )}
          </dl>

          <p className="mt-3 text-sm text-muted-foreground">
            Woon je net buiten dat gebied? Bel ons even, misschien lukt het toch.
          </p>
        </section>

        <section className="border border-border bg-card p-6">
          <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-crust">
            <ClockIcon className="size-5" />
          </span>
          <h2 className="mt-3 font-heading text-xl font-semibold">
            Wanneer moet je bestellen?
          </h2>
          <ul className="mt-3 space-y-3 text-sm">
            <li className="flex gap-3">
              <CroissantIcon className="mt-0.5 size-4 shrink-0 text-crust" />
              <span>
                <span className="font-medium">
                  Dagelijks brood en koffiekoeken:
                </span>{" "}
                tot {FULFILLMENT.orderCutoff.hour}u de dag vóór je afhaalt of laat
                leveren. Zo weet de bakker &apos;s avonds wat er moet gebakken
                worden.
              </span>
            </li>
            <li className="flex gap-3">
              <CakeSliceIcon className="mt-0.5 size-4 shrink-0 text-crust" />
              <span>
                <span className="font-medium">Taarten en feestgebak:</span> bij die
                producten staat hoeveel dagen we nodig hebben. Een feesttaart op
                maat bijvoorbeeld minstens 14 dagen vooraf.
              </span>
            </li>
            <li className="flex gap-3">
              <ClockIcon className="mt-0.5 size-4 shrink-0 text-crust" />
              <span>
                Je kan tot {FULFILLMENT.weeksAhead} weken vooruit bestellen. Handig
                voor een feest of een weekend met veel volk.
              </span>
            </li>
          </ul>
        </section>

        <section className="border border-border bg-card p-6">
          <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-crust">
            <BanknoteIcon className="size-5" />
          </span>
          <h2 className="mt-3 font-heading text-xl font-semibold">Betalen</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Online bestellen betekent online betalen: met Bancontact of de
            KBC/CBC-betaalknop. Je bestelling is pas definitief wanneer de betaling gelukt is
            — dan krijg je je bestelnummer te zien.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex gap-2">
              <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-crust" />
              De betaling loopt via een beveiligde betaalpagina. Wij zien je
              kaartgegevens nooit.
            </li>
            <li className="flex gap-2">
              <PhoneIcon className="mt-0.5 size-4 shrink-0 text-crust" />
              Iets aanpassen of annuleren? Bel ons op {SHOP.phone}, dan regelen we
              het samen.
            </li>
          </ul>
        </section>
      </div>

      <section className="mt-10 border border-border bg-card p-6">
        <h2 className="font-heading text-xl font-semibold">
          Allergenen en ingrediënten
        </h2>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Staat de allergenen-info bij het product, dan zie je welke van de 14
          wettelijke allergenen erin zitten. Ontbreekt die nog? Vraag gerust in
          de winkel.
        </p>
        <div className="mt-4">
          <AllergenReference />
        </div>
        <p className="mt-4 max-w-prose text-xs text-muted-foreground">
          We bakken alles in dezelfde bakkerij, waar gluten, melk, eieren, noten en
          sesam gebruikt worden. Sporen zijn daarom nooit volledig uit te sluiten.
          Heb je een zware allergie? Bel ons, dan bekijken we samen wat kan.
        </p>
      </section>

      <section className="mt-6 flex flex-col items-start gap-4 bg-secondary/60 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">Nog een vraag?</h2>
          <p className="text-sm text-muted-foreground">
            Bel ons tijdens de openingsuren, of spring binnen in de winkel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink
            href={`tel:${SHOP.phoneHref}`}
            className="h-11 rounded-none px-5"
          >
            <PhoneIcon className="size-4" /> {SHOP.phone}
          </ButtonLink>
          <ButtonLink
            href="/assortiment"
            variant="outline"
            className="h-11 rounded-none px-5"
          >
            Naar het assortiment
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
