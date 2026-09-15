import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BanknoteIcon, CheckIcon, FlaskConicalIcon, XIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatEuro } from "@/lib/money";
import { getOrderByToken } from "@/lib/orders";
import { SHOP } from "@/lib/shop-config";
import { simulatePayment } from "@/server/actions/payment";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Testbetaling",
  robots: { index: false, follow: false },
};

/**
 * Staat in voor de betaalpagina zolang er geen Mollie-sleutel is. Zo kan de
 * volledige flow — bestellen, betalen, bevestiging — getest en gedemonstreerd
 * worden zonder betaalaccount.
 */
export default async function SandboxPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ betaling?: string }>;
}) {
  const { token } = await params;
  const { betaling } = await searchParams;

  const order = await getOrderByToken(token);
  if (!order) notFound();

  const payment = order.payments.find(
    (candidate) => candidate.providerPaymentId === betaling,
  );
  if (!payment || payment.provider !== "sandbox") notFound();

  return (
    <div className="page-shell flex min-h-[70vh] items-center justify-center py-10">
      <div className="w-full max-w-md space-y-5 rounded-3xl border border-border bg-card p-6 shadow-warm-lg">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-warning/20 text-warning-foreground">
            <FlaskConicalIcon className="size-5" />
          </span>
          <div>
            <p className="eyebrow">Testbetaling</p>
            <h1 className="font-heading text-xl font-semibold">
              Betaalpagina (sandbox)
            </h1>
          </div>
        </div>

        <Alert className="border-warning/50 bg-warning/15">
          <FlaskConicalIcon />
          <AlertTitle>Dit is geen echte betaling</AlertTitle>
          <AlertDescription>
            Er is nog geen MOLLIE_API_KEY ingesteld. Kies hieronder zelf hoe de
            betaling afloopt. Met een Mollie-sleutel kom je hier op de echte
            Bancontact-pagina terecht.
          </AlertDescription>
        </Alert>

        <dl className="space-y-2 rounded-2xl bg-secondary/60 p-4 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Bestelling</dt>
            <dd className="font-medium">{order.orderNumber}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Begunstigde</dt>
            <dd className="font-medium">{SHOP.legalName}</dd>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2">
            <dt className="text-muted-foreground">Te betalen</dt>
            <dd className="font-heading text-lg font-semibold tabular-nums">
              {formatEuro(order.totalCents)}
            </dd>
          </div>
        </dl>

        <div className="space-y-2">
          <form action={simulatePayment}>
            <input type="hidden" name="token" value={token} />
            <input
              type="hidden"
              name="paymentId"
              value={payment.providerPaymentId}
            />
            <input type="hidden" name="outcome" value="paid" />
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-full text-base"
            >
              <CheckIcon className="size-4" /> Betaling laten slagen
            </Button>
          </form>

          <form action={simulatePayment}>
            <input type="hidden" name="token" value={token} />
            <input
              type="hidden"
              name="paymentId"
              value={payment.providerPaymentId}
            />
            <input type="hidden" name="outcome" value="failed" />
            <Button
              type="submit"
              variant="outline"
              className="h-11 w-full rounded-full"
            >
              <XIcon className="size-4" /> Betaling laten mislukken
            </Button>
          </form>

          <form action={simulatePayment}>
            <input type="hidden" name="token" value={token} />
            <input
              type="hidden"
              name="paymentId"
              value={payment.providerPaymentId}
            />
            <input type="hidden" name="outcome" value="canceled" />
            <Button
              type="submit"
              variant="ghost"
              className="h-11 w-full rounded-full"
            >
              Annuleren
            </Button>
          </form>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <BanknoteIcon className="size-3.5" />
          In productie: Bancontact, bankkaart of iDEAL via Mollie
        </p>
      </div>
    </div>
  );
}
