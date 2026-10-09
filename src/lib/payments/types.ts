/**
 * Eén smalle interface voor betalingen, zodat we van provider kunnen wisselen
 * zonder de checkout aan te passen. Vandaag: Mollie (Bancontact, KBC/CBC) en een
 * ingebouwde sandbox. Later kan hier een Worldline-implementatie naast staan.
 */

export type PaymentStatus =
  "open" | "pending" | "paid" | "failed" | "canceled" | "expired";

export const FINAL_PAYMENT_STATUSES: PaymentStatus[] = [
  "paid",
  "failed",
  "canceled",
  "expired",
];

export type CreatePaymentInput = {
  orderId: string;
  orderNumber: string;
  /** Onvoorspelbare sleutel van de bestelpagina van de klant */
  orderToken: string;
  amountCents: number;
  description: string;
  /** Waar de klant na het betalen terechtkomt. */
  redirectUrl: string;
  /** Waar de klant terechtkomt als hij afbreekt. */
  cancelUrl: string;
  /** Publieke URL die de provider aanroept bij statuswijziging. */
  webhookUrl: string | null;
  customerEmail?: string;
};

export type CreatedPayment = {
  provider: string;
  providerPaymentId: string;
  /** Pagina van de provider (of van de sandbox) waar de klant betaalt. */
  checkoutUrl: string;
  status: PaymentStatus;
  raw?: unknown;
};

export type FetchedPayment = {
  provider: string;
  providerPaymentId: string;
  status: PaymentStatus;
  method: string | null;
  paidAt: Date | null;
  raw?: unknown;
};

export interface PaymentGateway {
  /** Wordt bij de bestelling bewaard, bv. "mollie" of "sandbox". */
  readonly id: string;
  readonly label: string;
  /** true = er wordt niet echt geld verplaatst. */
  readonly isSandbox: boolean;
  createPayment(input: CreatePaymentInput): Promise<CreatedPayment>;
  fetchPayment(providerPaymentId: string): Promise<FetchedPayment>;
}

export class PaymentError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

export function paymentStatusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "Betaald";
    case "pending":
      return "In verwerking";
    case "open":
      return "Wacht op betaling";
    case "failed":
      return "Mislukt";
    case "canceled":
      return "Geannuleerd";
    case "expired":
      return "Verlopen";
    default:
      return status;
  }
}

/** Bancontact, kaart, ... zoals Mollie ze teruggeeft. */
export function paymentMethodLabel(method: string | null): string | null {
  if (!method) return null;
  const labels: Record<string, string> = {
    bancontact: "Bancontact",
    creditcard: "Bankkaart / kredietkaart",
    ideal: "iDEAL",
    banktransfer: "Overschrijving",
    applepay: "Apple Pay",
    paypal: "PayPal",
    payconiq: "Payconiq",
    belfius: "Belfius Pay Button",
    kbc: "KBC/CBC Betaalknop",
    sandbox: "Testbetaling",
  };
  return labels[method] ?? method;
}
