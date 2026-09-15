import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  CreditCardIcon,
  PhoneIcon,
  RefreshCwIcon,
} from "lucide-react";

import { ClearCart } from "@/components/cart/clear-cart";
import { OrderDetails } from "@/components/order-details";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button-link";
import { getOrderByToken, syncOrderPayment } from "@/lib/orders";
import { paymentMethodLabel } from "@/lib/payments/types";
import { SHOP } from "@/lib/shop-config";
import { retryPayment } from "@/server/actions/checkout";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Je bestelling",
  robots: { index: false, follow: false },
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ afgebroken?: string; fout?: string }>;
}) {
  const { token } = await params;
  const { afgebroken, fout } = await searchParams;

  let order = await getOrderByToken(token);
  if (!order) notFound();

  // De klant komt hier terug van de betaalpagina. Lokaal kan Mollie geen
  // webhook naar localhost sturen, dus halen we de status ook zelf op.
  if (order.status === "pending") {
    await syncOrderPayment(order.id);
    order = (await getOrderByToken(token)) ?? order;
  }

  const isPaid = order.status === "paid" || order.paymentStatus === "paid";
  const isWaiting = order.status === "pending";
  const method = paymentMethodLabel(order.paymentMethod);

  return (
    <div className="page-shell py-8 lg:py-12">
      {isPaid && <ClearCart />}

      <header className="max-w-2xl">
        <p className="eyebrow">Stap 3 van 3</p>

        {isPaid ? (
          <>
            <div className="mt-3 flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2Icon className="size-7" />
            </div>
            <h1 className="mt-4 font-heading text-3xl font-semibold sm:text-4xl">
              Bedankt, je bestelling staat vast
            </h1>
            <p className="mt-2 text-muted-foreground">
              We hebben je betaling ontvangen{method ? ` via ${method}` : ""}. Je
              bestelnummer is{" "}
              <span className="font-medium text-foreground">
                {order.orderNumber}
              </span>
              . Hou deze pagina bij, of noem gewoon je naam bij het afhalen.
            </p>
          </>
        ) : isWaiting ? (
          <>
            <div className="mt-3 flex size-14 items-center justify-center rounded-full bg-warning/20 text-warning-foreground">
              <ClockIcon className="size-7" />
            </div>
            <h1 className="mt-4 font-heading text-3xl font-semibold sm:text-4xl">
              {afgebroken
                ? "Je betaling is afgebroken"
                : "We wachten nog op je betaling"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Bestelling{" "}
              <span className="font-medium text-foreground">
                {order.orderNumber}
              </span>{" "}
              is klaargezet, maar nog niet betaald. Ze ligt pas vast zodra de
              betaling gelukt is. Je kan het meteen opnieuw proberen.
            </p>
          </>
        ) : (
          <>
            <div className="mt-3 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangleIcon className="size-7" />
            </div>
            <h1 className="mt-4 font-heading text-3xl font-semibold sm:text-4xl">
              Deze bestelling is niet doorgegaan
            </h1>
            <p className="mt-2 text-muted-foreground">
              De betaling voor {order.orderNumber} is niet afgerond, dus we hebben
              de bestelling niet ingepland. Je kan opnieuw proberen of ons even
              bellen op {SHOP.phone}.
            </p>
          </>
        )}
      </header>

      {fout && (
        <Alert variant="destructive" className="mt-6 max-w-2xl">
          <AlertTriangleIcon />
          <AlertTitle>De betaling kon niet opnieuw gestart worden</AlertTitle>
          <AlertDescription>{fout}</AlertDescription>
        </Alert>
      )}

      {!isPaid && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <form
            action={async () => {
              "use server";
              await retryPayment(token);
            }}
          >
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-full px-6 text-base sm:w-auto"
            >
              <CreditCardIcon className="size-4" /> Opnieuw betalen
            </Button>
          </form>
          <ButtonLink
            href="/assortiment"
            variant="outline"
            size="lg"
            className="h-12 rounded-full px-6 text-base"
          >
            Verder winkelen
          </ButtonLink>
          <ButtonLink
            href={`tel:${SHOP.phoneHref}`}
            variant="ghost"
            size="lg"
            className="h-12 rounded-full px-6 text-base"
          >
            <PhoneIcon className="size-4" /> {SHOP.phone}
          </ButtonLink>
        </div>
      )}

      {isPaid && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <ButtonLink
            href="/assortiment"
            size="lg"
            className="h-12 rounded-full px-6 text-base"
          >
            Nog iets bestellen
          </ButtonLink>
          <ButtonLink
            href={`tel:${SHOP.phoneHref}`}
            variant="outline"
            size="lg"
            className="h-12 rounded-full px-6 text-base"
          >
            <PhoneIcon className="size-4" /> Iets aanpassen? Bel {SHOP.phone}
          </ButtonLink>
        </div>
      )}

      <div className="mt-8">
        <OrderDetails order={order} />
      </div>

      {isWaiting && (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCwIcon className="size-4" />
          Net betaald? Herlaad deze pagina, dan halen we de status opnieuw op.
        </p>
      )}
    </div>
  );
}
