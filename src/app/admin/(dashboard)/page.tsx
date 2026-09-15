import Link from "next/link";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CroissantIcon,
  FlaskConicalIcon,
  PackageIcon,
  ReceiptTextIcon,
  TruckIcon,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button-link";
import { formatIsoDateShort } from "@/lib/datetime";
import { formatEuro } from "@/lib/money";
import { getAdminStats } from "@/lib/orders";
import { paymentMode } from "@/lib/payments";
import { getClosedDates } from "@/lib/settings";
import { getAvailableSlots } from "@/lib/slots";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [stats, closedDates] = await Promise.all([
    getAdminStats(),
    getClosedDates(),
  ]);
  const mode = paymentMode();
  const nextDelivery = getAvailableSlots({ type: "delivery", closedDates })[0];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Overzicht
        </h1>
        <p className="text-sm text-muted-foreground">
          Wat er vandaag te doen is, en hoe de webshop erbij staat.
        </p>
      </header>

      {mode.isSandbox && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/50 bg-warning/15 p-4">
          <FlaskConicalIcon className="mt-0.5 size-5 shrink-0 text-warning-foreground" />
          <div className="text-sm">
            <p className="font-medium">De webshop staat in testmodus</p>
            <p className="text-muted-foreground">
              Er is nog geen Mollie-sleutel ingesteld, dus klanten betalen niet
              echt. Zet MOLLIE_API_KEY in de omgevingsvariabelen om live te gaan.
            </p>
          </div>
        </div>
      )}

      {mode.isTestKey && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/50 bg-warning/15 p-4">
          <FlaskConicalIcon className="mt-0.5 size-5 shrink-0 text-warning-foreground" />
          <div className="text-sm">
            <p className="font-medium">Mollie staat op een test-sleutel</p>
            <p className="text-muted-foreground">
              Betalingen lopen via Mollie test. Vervang de key door je live-key
              (begint met live_) zodra je klaar bent.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ReceiptTextIcon}
          label="Wacht op betaling"
          value={String(stats.openOrders)}
          hint="Nog niet bevestigd"
        />
        <StatCard
          icon={PackageIcon}
          label="Te bakken"
          value={String(stats.paidToday)}
          hint="Betaalde bestellingen vanaf vandaag"
        />
        <StatCard
          icon={CroissantIcon}
          label="Producten online"
          value={String(stats.productCount)}
          hint="Actief in de webshop"
        />
        <StatCard
          icon={TruckIcon}
          label="Volgende levering"
          value={nextDelivery ? formatIsoDateShort(nextDelivery.date) : "—"}
          hint={nextDelivery?.timeLabel ?? "Geen moment vrij"}
        />
      </div>

      <section className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="font-heading text-lg font-semibold">
            Eerstvolgende bestellingen
          </h2>
          <ButtonLink
            href="/admin/bestellingen"
            variant="ghost"
            size="sm"
            className="rounded-full"
          >
            Alles bekijken <ArrowRightIcon className="size-4" />
          </ButtonLink>
        </div>

        {stats.upcoming.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            Er staan nog geen betaalde bestellingen klaar. Zodra een klant betaalt,
            verschijnt de bestelling hier.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {stats.upcoming.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/bestellingen/${order.id}`}
                  className="flex flex-wrap items-center gap-3 p-4 hover:bg-secondary/50"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                    {order.fulfillmentType === "delivery" ? (
                      <TruckIcon className="size-4" />
                    ) : (
                      <PackageIcon className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{order.customerName}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {order.slotLabel}
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {order.orderNumber}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatEuro(order.totalCents)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {stats.lowStock.length > 0 && (
        <section className="rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border p-5">
            <AlertTriangleIcon className="size-4 text-warning-foreground" />
            <h2 className="font-heading text-lg font-semibold">
              Voorraad loopt op zijn einde
            </h2>
          </div>
          <ul className="divide-y divide-border">
            {stats.lowStock.map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between gap-3 p-4"
              >
                <span className="font-medium">{product.name}</span>
                <span className="flex items-center gap-3">
                  <span className="text-sm tabular-nums">nog {product.stock}</span>
                  <ButtonLink
                    href={`/admin/producten/${product.id}`}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                  >
                    Aanpassen
                  </ButtonLink>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs font-medium tracking-wide uppercase">{label}</span>
      </div>
      <p className="mt-2 font-heading text-3xl font-semibold tabular-nums">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
