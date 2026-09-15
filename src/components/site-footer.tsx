import Link from "next/link";
import { ClockIcon, MapPinIcon, PhoneIcon, WheatIcon } from "lucide-react";

import { formatEuro } from "@/lib/money";
import { FULFILLMENT, SHOP } from "@/lib/shop-config";
import { formatTime } from "@/lib/datetime";
import { WEEKDAY_NAMES_NL } from "@/lib/datetime";

function openingHours() {
  return FULFILLMENT.pickupWindows.map((serviceWindow) => ({
    day: WEEKDAY_NAMES_NL[serviceWindow.weekday],
    hours: `${formatTime(serviceWindow.start)} - ${formatTime(serviceWindow.end)}`,
  }));
}

export function SiteFooter() {
  const hours = openingHours();

  return (
    <footer className="mt-16 border-t border-border bg-secondary/40">
      <div className="page-shell grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <WheatIcon className="size-5" />
            </span>
            <span className="font-heading text-xl font-semibold">{SHOP.name}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {SHOP.tagline}. Elke bakdag versgebakken brood, koffiekoeken en
            patisserie — online besteld, klaar wanneer jij het wil.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="font-heading text-base font-semibold">Waar vind je ons</h2>
          <address className="space-y-2 text-sm text-muted-foreground not-italic">
            <span className="flex items-start gap-2">
              <MapPinIcon className="mt-0.5 size-4 shrink-0" />
              <span>
                {SHOP.street}
                <br />
                {SHOP.postalCode} {SHOP.city}
              </span>
            </span>
            <a
              href={`tel:${SHOP.phoneHref}`}
              className="flex items-center gap-2 hover:text-foreground"
            >
              <PhoneIcon className="size-4 shrink-0" />
              {SHOP.phone}
            </a>
            {SHOP.email ? (
              <a
                href={`mailto:${SHOP.email}`}
                className="flex items-center gap-2 hover:text-foreground"
              >
                {SHOP.email}
              </a>
            ) : null}
          </address>
        </div>

        <div className="space-y-3">
          <h2 className="font-heading text-base font-semibold">Afhalen in de winkel</h2>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {hours.map((entry) => (
              <li key={entry.day} className="flex items-center justify-between gap-4">
                <span className="capitalize">{entry.day}</span>
                <span className="tabular-nums">{entry.hours}</span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-4">
              <span>maandag &amp; dinsdag</span>
              <span>gesloten</span>
            </li>
          </ul>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ClockIcon className="mt-0.5 size-3.5 shrink-0" />
            Openingsuren zijn indicatief — bel ons als je twijfelt.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="font-heading text-base font-semibold">Bestellen</h2>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>
              <Link href="/assortiment" className="hover:text-foreground">
                Assortiment
              </Link>
            </li>
            <li>
              <Link href="/winkelwagen" className="hover:text-foreground">
                Winkelwagen
              </Link>
            </li>
            <li>
              <Link href="/info" className="hover:text-foreground">
                Afhalen, leveren &amp; betalen
              </Link>
            </li>
            <li>
              <a
                href={SHOP.website}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                Onze website
              </a>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Levering in {SHOP.city} voor {formatEuro(FULFILLMENT.deliveryFeeCents)} —
            donderdagvoormiddag, vrijdagnamiddag en zondagvoormiddag.
          </p>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="page-shell flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SHOP.legalName} — {SHOP.city}
          </p>
          <p>
            Betalen met Bancontact of bankkaart · Online besteld is online
            betaald.
          </p>
        </div>
      </div>
    </footer>
  );
}
