import { isMollieConfigured, mollieGateway, mollieIsTestKey } from "@/lib/payments/mollie";
import { sandboxGateway } from "@/lib/payments/sandbox";
import type { PaymentGateway } from "@/lib/payments/types";

/**
 * Kiest de betaalprovider. Zolang er geen MOLLIE_API_KEY is, draait de webshop
 * in sandbox: de flow is identiek, er wordt geen geld verplaatst.
 *
 * Worldline later toevoegen (zij gebruiken Worldline in de winkel):
 *   1. maak src/lib/payments/worldline.ts met een `PaymentGateway`-implementatie
 *      (createPayment + fetchPayment tegen de Worldline Hosted Checkout API);
 *   2. voeg hieronder een tak toe, bv. op basis van PAYMENT_PROVIDER=worldline;
 *   3. voeg een webhookroute toe naar analogie met
 *      src/app/api/webhooks/mollie/route.ts.
 * De checkout, de bestellingen en de admin blijven ongewijzigd — die kennen
 * enkel de interface, niet de provider.
 */
export function getPaymentGateway(): PaymentGateway {
  if (isMollieConfigured()) return mollieGateway;
  return sandboxGateway;
}

export function paymentGatewayById(id: string): PaymentGateway | null {
  if (id === mollieGateway.id) return mollieGateway;
  if (id === sandboxGateway.id) return sandboxGateway;
  return null;
}

export type PaymentModeInfo = {
  provider: string;
  label: string;
  isSandbox: boolean;
  /** true bij een Mollie test-key: echte flow, testgeld. */
  isTestKey: boolean;
};

export function paymentMode(): PaymentModeInfo {
  const gateway = getPaymentGateway();
  return {
    provider: gateway.id,
    label: gateway.label,
    isSandbox: gateway.isSandbox,
    isTestKey: gateway.id === "mollie" && mollieIsTestKey(),
  };
}
