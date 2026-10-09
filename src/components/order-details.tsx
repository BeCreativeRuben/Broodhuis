import {
  CalendarClockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  StoreIcon,
  TruckIcon,
} from "lucide-react";

import { capitalizeFirst } from "@/lib/datetime";
import { allergenSummary } from "@/lib/allergens";
import { formatEuro } from "@/lib/money";
import type { CustomerOrder } from "@/lib/orders";
import { SHOP } from "@/lib/shop-config";
import { OrderLineChoice } from "@/components/order-line-choice";
import { formatQuantityLabel, isWeightPortionUnit } from "@/lib/weight";

/** Bestelde producten, moment en gegevens — gebruikt op de bestelpagina. */
export function OrderDetails({ order }: { order: CustomerOrder }) {
  const isDelivery = order.fulfillmentType === "delivery";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section>
        <h2 className="font-heading text-lg font-semibold">Je bestelling</h2>
        <ul className="mt-3 divide-y divide-border">
          {order.items.map((item) => {
            const allergens = allergenSummary(item.allergens);
            return (
              <li key={item.id} className="flex items-start gap-3 py-3">
                <span className="min-w-8 shrink-0 text-sm font-medium tabular-nums">
                  {isWeightPortionUnit(item.unit)
                    ? formatQuantityLabel(item.quantity, item.unit)
                    : item.quantity}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{item.name}</span>
                  <OrderLineChoice variantLabel={item.variantLabel} />
                  <span className="text-xs text-muted-foreground">
                    {formatEuro(item.unitPriceCents)} {item.unit}
                    {allergens ? ` · bevat ${allergens.toLowerCase()}` : ""}
                  </span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {formatEuro(item.lineTotalCents)}
                </span>
              </li>
            );
          })}
        </ul>

        <dl className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Subtotaal</dt>
            <dd className="tabular-nums">{formatEuro(order.subtotalCents)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">
              {isDelivery ? "Levering" : "Afhalen"}
            </dt>
            <dd className="tabular-nums">
              {order.deliveryFeeCents === 0
                ? "Gratis"
                : formatEuro(order.deliveryFeeCents)}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2 font-heading text-lg font-semibold">
            <dt>Totaal</dt>
            <dd className="tabular-nums">{formatEuro(order.totalCents)}</dd>
          </div>
        </dl>
      </section>

      <div className="space-y-4">
        <section>
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            {isDelivery ? (
              <TruckIcon className="size-4 text-crust" />
            ) : (
              <StoreIcon className="size-4 text-crust" />
            )}
            {isDelivery ? "Levering" : "Afhalen"}
          </h2>

          <p className="mt-3 flex items-start gap-2 text-sm">
            <CalendarClockIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>{capitalizeFirst(order.slotLabel)}</span>
          </p>

          <p className="mt-2 flex items-start gap-2 text-sm">
            <MapPinIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            {isDelivery ? (
              <span>
                {order.street} {order.houseNumber}
                <br />
                {order.postalCode} {order.city}
                {order.deliveryNote ? (
                  <>
                    <br />
                    <span className="text-muted-foreground">
                      {order.deliveryNote}
                    </span>
                  </>
                ) : null}
              </span>
            ) : (
              <span>
                {SHOP.legalName}
                <br />
                {SHOP.street}, {SHOP.postalCode} {SHOP.city}
              </span>
            )}
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">Jouw gegevens</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p className="font-medium">{order.customerName}</p>
            <p className="flex items-center gap-2">
              <MailIcon className="size-4 shrink-0 text-muted-foreground" />
              {order.customerEmail}
            </p>
            <p className="flex items-center gap-2">
              <PhoneIcon className="size-4 shrink-0 text-muted-foreground" />
              {order.customerPhone}
            </p>
            {order.note ? (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Opmerking: </span>
                {order.note}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
