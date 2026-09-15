import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeftIcon,
  CreditCardIcon,
  MailIcon,
  MapPinIcon,
  PackageIcon,
  PhoneIcon,
  PrinterIcon,
  TruckIcon,
} from "lucide-react";

import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { Button } from "@/components/ui/button";
import { allergenSummary } from "@/lib/allergens";
import { formatInstant } from "@/lib/datetime";
import { formatEuro } from "@/lib/money";
import { getOrderById } from "@/lib/orders";
import { paymentMethodLabel, paymentStatusLabel } from "@/lib/payments/types";
import { SHOP } from "@/lib/shop-config";
import { setOrderStatus } from "@/server/actions/admin-orders";

export const dynamic = "force-dynamic";

const statusActions: Array<{ status: string; label: string; hint: string }> = [
  { status: "paid", label: "Terug naar betaald", hint: "Nog te bakken" },
  { status: "ready", label: "Klaargezet", hint: "Staat klaar voor de klant" },
  { status: "completed", label: "Afgehandeld", hint: "Afgehaald of geleverd" },
  { status: "cancelled", label: "Annuleren", hint: "Voorraad komt terug vrij" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  return { title: order ? `Bestelling ${order.orderNumber}` : "Bestelling" };
}

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const isDelivery = order.fulfillmentType === "delivery";
  const latestPayment = order.payments[0];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/bestellingen"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeftIcon className="size-4" /> Bestellingen
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            {order.orderNumber}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          Geplaatst op {formatInstant(order.createdAt)}
          {order.paidAt ? ` · betaald op ${formatInstant(order.paidAt)}` : ""}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="font-heading text-lg font-semibold">Te bakken</h2>
          <ul className="mt-3 divide-y divide-border">
            {order.items.map((item) => {
              const allergens = allergenSummary(item.allergens);
              return (
                <li key={item.id} className="flex items-start gap-3 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary font-medium tabular-nums">
                    {item.quantity}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatEuro(item.unitPriceCents)} {item.unit}
                      {allergens ? ` · ${allergens}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatEuro(item.lineTotalCents)}
                  </span>
                </li>
              );
            })}
          </ul>

          <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotaal</dt>
              <dd className="tabular-nums">{formatEuro(order.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {isDelivery ? "Leveringskost" : "Afhalen"}
              </dt>
              <dd className="tabular-nums">
                {order.deliveryFeeCents === 0
                  ? "gratis"
                  : formatEuro(order.deliveryFeeCents)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-1.5 font-heading text-base font-semibold">
              <dt>Totaal</dt>
              <dd className="tabular-nums">{formatEuro(order.totalCents)}</dd>
            </div>
          </dl>

          {order.note && (
            <div className="mt-4 rounded-xl bg-accent/25 p-3 text-sm">
              <p className="font-medium">Opmerking van de klant</p>
              <p className="text-muted-foreground">{order.note}</p>
            </div>
          )}
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
              {isDelivery ? (
                <TruckIcon className="size-4" />
              ) : (
                <PackageIcon className="size-4" />
              )}
              {isDelivery ? "Leveren" : "Afhalen"}
            </h2>
            <p className="mt-2 text-sm font-medium capitalize">{order.slotLabel}</p>
            <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPinIcon className="mt-0.5 size-4 shrink-0" />
              {isDelivery ? (
                <span>
                  {order.street} {order.houseNumber}
                  <br />
                  {order.postalCode} {order.city}
                  {order.deliveryNote ? (
                    <>
                      <br />
                      <span className="italic">{order.deliveryNote}</span>
                    </>
                  ) : null}
                </span>
              ) : (
                <span>
                  In de winkel
                  <br />
                  {SHOP.street}, {SHOP.city}
                </span>
              )}
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-heading text-lg font-semibold">Klant</h2>
            <p className="mt-2 font-medium">{order.customerName}</p>
            <a
              href={`tel:${order.customerPhone.replace(/\s/g, "")}`}
              className="mt-2 flex items-center gap-2 text-sm hover:underline"
            >
              <PhoneIcon className="size-4 shrink-0 text-muted-foreground" />
              {order.customerPhone}
            </a>
            <a
              href={`mailto:${order.customerEmail}`}
              className="mt-1 flex items-center gap-2 text-sm break-all hover:underline"
            >
              <MailIcon className="size-4 shrink-0 text-muted-foreground" />
              {order.customerEmail}
            </a>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
              <CreditCardIcon className="size-4" /> Betaling
            </h2>
            <dl className="mt-2 space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Status</dt>
                <dd>{paymentStatusLabel(order.paymentStatus)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Methode</dt>
                <dd>{paymentMethodLabel(order.paymentMethod) ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Provider</dt>
                <dd>{order.paymentProvider ?? "—"}</dd>
              </div>
              {latestPayment && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Referentie</dt>
                  <dd className="font-mono text-xs break-all">
                    {latestPayment.providerPaymentId}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Status bijwerken</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Zo weet je in één blik welke bestellingen nog moeten gebakken of
          klaargezet worden.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {statusActions
            .filter((action) => action.status !== order.status)
            .map((action) => (
              <form key={action.status} action={setOrderStatus}>
                <input type="hidden" name="id" value={order.id} />
                <input type="hidden" name="status" value={action.status} />
                <Button
                  type="submit"
                  variant={action.status === "cancelled" ? "destructive" : "outline"}
                  className="rounded-full"
                  title={action.hint}
                >
                  {action.label}
                </Button>
              </form>
            ))}
        </div>
      </section>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <PrinterIcon className="size-3.5" />
        Tip: gebruik Ctrl/Cmd + P om deze bestelling af te drukken voor het atelier.
      </p>
    </div>
  );
}
