import { CalendarOffIcon, CreditCardIcon, FileCode2Icon } from "lucide-react";

import { ClosedDatesForm } from "@/components/admin/closed-dates-form";
import { Badge } from "@/components/ui/badge";
import { formatIsoDateLong, formatTime, WEEKDAY_NAMES_NL } from "@/lib/datetime";
import { formatEuro } from "@/lib/money";
import { paymentMode } from "@/lib/payments";
import { FULFILLMENT, SHOP } from "@/lib/shop-config";
import { getClosedDates } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = { title: "Instellingen" };

export default async function AdminSettingsPage() {
  const [closedDates] = await Promise.all([getClosedDates()]);
  const mode = paymentMode();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Instellingen
        </h1>
        <p className="text-sm text-muted-foreground">
          Sluitingsdagen beheer je hier zelf. Openingsuren, tijdsloten en
          leveringskost staan in het bestand{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5">
            src/lib/shop-config.ts
          </code>
          .
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <CalendarOffIcon className="size-4" /> Sluitingsdagen
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Handig voor feestdagen, een verlof of een bakvrije dag. Klanten kunnen die
          dagen dan niet meer kiezen.
        </p>

        <ClosedDatesForm dates={closedDates} />

        {closedDates.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {closedDates.map((date) => (
              <Badge key={date} variant="secondary" className="rounded-full">
                {formatIsoDateLong(date)}
              </Badge>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <CreditCardIcon className="size-4" /> Betalingen
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-muted-foreground">Provider</dt>
            <dd className="flex items-center gap-2">
              {mode.label}
              {mode.isSandbox && (
                <Badge className="rounded-full border-warning/50 bg-warning/20 text-warning-foreground">
                  testmodus
                </Badge>
              )}
              {mode.isTestKey && (
                <Badge className="rounded-full border-warning/50 bg-warning/20 text-warning-foreground">
                  test-sleutel
                </Badge>
              )}
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-muted-foreground">Betaalmethodes</dt>
            <dd>
              {process.env.MOLLIE_METHODS?.trim()
                ? process.env.MOLLIE_METHODS
                : "alles wat in Mollie aan staat"}
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-muted-foreground">Leveringskost</dt>
            <dd>{formatEuro(FULFILLMENT.deliveryFeeCents)}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-muted-foreground">Leveringsgebied</dt>
            <dd>postcode {FULFILLMENT.deliveryPostalCodes.join(", ")}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Mollie blijft in testmodus tot Ruben de live-sleutel zet. In de code
          staan alleen Bancontact en de KBC/CBC-betaalknop aan, geen
          kredietkaarten.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <FileCode2Icon className="size-4" /> Momenten en openingsuren
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Deze momenten komen uit de configuratie. Wil je ze wijzigen, pas dan{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5">
            src/lib/shop-config.ts
          </code>{" "}
          aan (of vraag het even aan wie de webshop beheert).
        </p>

        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">Afhalen</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {FULFILLMENT.pickupWindows.map((serviceWindow) => (
                <li key={serviceWindow.id} className="flex justify-between gap-3">
                  <span className="capitalize">
                    {WEEKDAY_NAMES_NL[serviceWindow.weekday]}
                  </span>
                  <span className="tabular-nums">
                    {formatTime(serviceWindow.start)} -{" "}
                    {formatTime(serviceWindow.end)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Leveren</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {FULFILLMENT.deliveryWindows.map((serviceWindow) => (
                <li key={serviceWindow.id} className="flex justify-between gap-3">
                  <span className="capitalize">
                    {WEEKDAY_NAMES_NL[serviceWindow.weekday]}
                  </span>
                  <span className="tabular-nums">
                    {formatTime(serviceWindow.start)} -{" "}
                    {formatTime(serviceWindow.end)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Besteldeadline: tot {FULFILLMENT.orderCutoff.hour}u,{" "}
          {FULFILLMENT.orderCutoff.daysBefore === 1
            ? "de dag vóór"
            : `${FULFILLMENT.orderCutoff.daysBefore} dagen vóór`}{" "}
          het gekozen moment. Klanten kunnen tot {FULFILLMENT.weeksAhead} weken
          vooruit boeken.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Winkel: {SHOP.street}, {SHOP.postalCode} {SHOP.city} · {SHOP.phone}
        </p>
      </section>
    </div>
  );
}
