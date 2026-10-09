import Link from "next/link";
import { PrinterIcon } from "lucide-react";

import { OrderLineChoice } from "@/components/order-line-choice";
import { currentIsoDate, formatIsoDateLong } from "@/lib/datetime";
import { listOrders } from "@/lib/orders";
import { formatOrderLineLabel } from "@/lib/weight";

export const dynamic = "force-dynamic";

export const metadata = { title: "Daglijst" };

export default async function DailyListPage({
  searchParams,
}: {
  searchParams: Promise<{ datum?: string }>;
}) {
  const { datum } = await searchParams;
  const slotDate = datum && /^\d{4}-\d{2}-\d{2}$/.test(datum) ? datum : currentIsoDate();
  const orders = await listOrders({
    status: "open",
    slotDate,
  });
  const printable = orders.filter((order) =>
    ["paid", "ready"].includes(order.status),
  );

  return (
    <div className="space-y-6">
      <header className="print-hidden">
        <Link
          href="/admin/bestellingen"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Bestellingen
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold sm:text-3xl">
          Daglijst
        </h1>
        <p className="text-sm text-muted-foreground">
          Betaalde bestellingen voor {formatIsoDateLong(slotDate)}. Print dit
          voor het atelier.
        </p>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <PrinterIcon className="size-3.5" />
          Ctrl/Cmd + P
        </p>
      </header>

      <h1 className="hidden font-heading text-2xl font-semibold print:block">
        Daglijst {formatIsoDateLong(slotDate)}
      </h1>

      {printable.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Geen betaalde bestellingen op deze dag.
        </p>
      ) : (
        <ul className="space-y-6">
          {printable.map((order) => (
            <li key={order.id} className="break-inside-avoid">
              <p className="font-heading text-lg font-semibold">
                {order.orderNumber} · {order.customerName}
              </p>
              <p className="text-sm text-muted-foreground">{order.slotLabel}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {formatOrderLineLabel(item.quantity, item.unit, item.name)}
                    <OrderLineChoice variantLabel={item.variantLabel} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
