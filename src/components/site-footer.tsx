import Link from "next/link";
import { ClockIcon, MapPinIcon, PhoneIcon } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { SocialLinks } from "@/components/social-links";
import { formatEuro } from "@/lib/money";
import { FULFILLMENT, SHOP } from "@/lib/shop-config";
import { formatTime, WEEKDAY_NAMES_NL } from "@/lib/datetime";

function openingHours() {
  return FULFILLMENT.pickupWindows.map((serviceWindow) => ({
    day: WEEKDAY_NAMES_NL[serviceWindow.weekday],
    hours: `${formatTime(serviceWindow.start)} - ${formatTime(serviceWindow.end)}`,
  }));
}

export function SiteFooter() {
  const hours = openingHours();

  return (
    <footer className="print-hidden mt-16 border-t border-border bg-secondary/50">
      <div className="page-shell grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <BrandLogo className="h-9 lg:h-10" />
          <p className="text-sm text-muted-foreground">
            {SHOP.tagline}. Elke bakdag versgebakken brood, koffiekoeken en
            patisserie — online besteld, klaar wanneer jij het wil.
          </p>
          <SocialLinks />
        </div>

        <div className="space-y-3">
          <h2 className="font-heading text-lg">Waar vind je ons</h2>
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
            <a
              href={SHOP.facebook}
              target="_blank"
              rel="noreferrer"
              className="block hover:text-foreground"
            >
              Contacteer ons op messenger
            </a>
          </address>
        </div>

        <div className="space-y-3">
          <h2 className="font-heading text-lg">Afhalen in de winkel</h2>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {hours.map((entry) => (
              <li
                key={entry.day}
                className="flex items-center justify-between gap-4"
              >
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
          <h2 className="font-heading text-lg">Bestellen</h2>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>
              <Link href="/bestellen" className="hover:text-foreground">
                Bestellen
              </Link>
            </li>
            <li>
              <Link href="/assortiment" className="hover:text-foreground">
                Assortiment
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
                bakkerij-tbroodhuis.be
              </a>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Levering in {SHOP.city} voor {formatEuro(FULFILLMENT.deliveryFeeCents)}{" "}
            — donderdagvoormiddag, vrijdagnamiddag en zondagvoormiddag.
          </p>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="page-shell flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SHOP.legalName} — {SHOP.vat}
          </p>
          <p>
            Betalen met Bancontact of bankkaart · Online besteld is online betaald.
          </p>
        </div>
      </div>
    </footer>
  );
}
