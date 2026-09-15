"use server";

import { redirect } from "next/navigation";

import { getOrderByToken, markSandboxPayment } from "@/lib/orders";

/**
 * Alleen voor de ingebouwde sandbox: de klant kiest zelf of de testbetaling
 * lukt of mislukt. Zodra er een MOLLIE_API_KEY is, komt deze pagina niet meer
 * voor in de flow.
 */
export async function simulatePayment(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const paymentId = String(formData.get("paymentId") ?? "");
  const outcome = String(formData.get("outcome") ?? "");

  const order = await getOrderByToken(token);
  if (!order) throw new Error("Bestelling niet gevonden.");

  const payment = order.payments.find(
    (candidate) => candidate.providerPaymentId === paymentId,
  );
  if (!payment || payment.provider !== "sandbox") {
    throw new Error("Deze testbetaling hoort niet bij deze bestelling.");
  }

  const status =
    outcome === "paid" ? "paid" : outcome === "canceled" ? "canceled" : "failed";

  await markSandboxPayment(paymentId, status);
  redirect(`/bestelling/${order.publicToken}`);
}
