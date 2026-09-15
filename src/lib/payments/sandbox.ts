import { prisma } from "@/lib/db";
import {
  PaymentError,
  type CreatePaymentInput,
  type CreatedPayment,
  type FetchedPayment,
  type PaymentGateway,
  type PaymentStatus,
} from "@/lib/payments/types";
import { absoluteUrl } from "@/lib/site-url";

/**
 * Ingebouwde testbetaling voor wanneer er (nog) geen MOLLIE_API_KEY is.
 * De klant doorloopt exact dezelfde flow, maar kiest op een lokale pagina zelf
 * of de betaling lukt of mislukt. Zo is de volledige webshop te demonstreren
 * zonder betaalaccount.
 */
export const sandboxGateway: PaymentGateway = {
  id: "sandbox",
  label: "Testbetaling (sandbox)",
  isSandbox: true,

  async createPayment(input: CreatePaymentInput): Promise<CreatedPayment> {
    const providerPaymentId = `sbx_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;

    return {
      provider: this.id,
      providerPaymentId,
      checkoutUrl: absoluteUrl(
        `/betaling/sandbox/${encodeURIComponent(input.orderNumber)}?betaling=${providerPaymentId}`,
      ),
      status: "open",
      raw: { simulated: true, amountCents: input.amountCents },
    };
  },

  async fetchPayment(providerPaymentId: string): Promise<FetchedPayment> {
    const payment = await prisma.payment.findUnique({
      where: { providerPaymentId },
      select: { status: true, method: true, updatedAt: true },
    });

    if (!payment) {
      throw new PaymentError("Deze testbetaling bestaat niet (meer).");
    }

    return {
      provider: this.id,
      providerPaymentId,
      status: payment.status as PaymentStatus,
      method: payment.method ?? "sandbox",
      paidAt: payment.status === "paid" ? payment.updatedAt : null,
    };
  },
};
