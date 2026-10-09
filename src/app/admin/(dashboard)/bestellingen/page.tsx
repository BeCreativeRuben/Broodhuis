import Link from "next/link";
import { PackageIcon, ReceiptTextIcon, SearchIcon, TruckIcon } from "lucide-react";

import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatInstant } from "@/lib/datetime";
import { formatEuro } from "@/lib/money";
import { listOrders, type OrderStatus } from "@/lib/orders";
import { cn } from "@/lib/utils";
import { formatOrderLineLabel } from "@/lib/weight";

export const dynamic = "force-dynamic";

export const metadata = { title: "Bestellingen" };

const filters = [
  { value: "open", label: "Lopend" },
  { value: "pending", label: "Wacht op betaling" },
  { value: "paid", label: "Betaald" },
  { value: "ready", label: "Klaar" },
  { value: "completed", label: "Afgehandeld" },
  { value: "cancelled", label: "Geannuleerd" },
  { value: "failed", label: "Niet doorgegaan" },
  { value: "", label: "Alles" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; zoek?: string }>;
}) {
  const { status, zoek } = await searchParams;
  const activeStatus = status ?? "open";

  const orders = await listOrders({
    status:
      activeStatus === "" ? undefined : (activeStatus as OrderStatus | "open"),
    search: zoek,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Bestellingen
        </h1>
        <p className="text-sm text-muted-foreground">
          Alles wat er via de webshop binnenkwam, met het gekozen moment en de
          betaalstatus.
        </p>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((filter) => (
            <Link
              key={filter.value}
              href={
                filter.value === ""
                  ? "/admin/bestellingen?status="
                  : `/admin/bestellingen?status=${filter.value}`
              }
              className={cn(
                "inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-sm font-medium whitespace-nowrap",
                activeStatus === filter.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-secondary",
              )}
            >
              {filter.label}
            </Link>
          ))}
        </nav>

        <form className="flex gap-2" action="/admin/bestellingen">
          <input type="hidden" name="status" value="" />
          <Input
            name="zoek"
            defaultValue={zoek ?? ""}
            placeholder="Zoek op naam, e-mail of bestelnummer"
            className="h-10 lg:w-72"
          />
          <Button type="submit" variant="outline" className="h-10 rounded-full">
            <SearchIcon className="size-4" />
            <span className="sr-only lg:not-sr-only">Zoeken</span>
          </Button>
        </form>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary">
            <ReceiptTextIcon className="size-6 text-crust" />
          </div>
          <h2 className="mt-4 font-heading text-lg font-semibold">
            Geen bestellingen in deze lijst
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {zoek
              ? "Niets gevonden voor die zoekterm. Probeer een deel van de naam of het bestelnummer."
              : "Zodra een klant betaalt, verschijnt de bestelling hier met het afhaal- of leveringsmoment."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/bestellingen/${order.id}`}
                className="block rounded-2xl border border-border bg-card p-4 hover:bg-secondary/40"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                    {order.fulfillmentType === "delivery" ? (
                      <TruckIcon className="size-4" />
                    ) : (
                      <PackageIcon className="size-4" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-base font-semibold">
                        {order.customerName}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.fulfillmentType === "delivery"
                        ? "Levering"
                        : "Afhaling"}{" "}
                      · {order.slotLabel}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {order.items
                        .map((item) =>
                          formatOrderLineLabel(
                            item.quantity,
                            item.unit,
                            item.variantLabel
                              ? `${item.name} (${item.variantLabel.replace(/https:\/\/\S+/g, "foto")})`
                              : item.name,
                          ),
                        )
                        .join(", ")}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-heading text-base font-semibold tabular-nums">
                      {formatEuro(order.totalCents)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatInstant(order.createdAt)}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
