"use server";

import { redirect } from "next/navigation";

import type { CartItem, PricedCart } from "@/lib/cart";
import { priceCart } from "@/lib/cart-pricing";
import type { CheckoutData, SlotOption } from "@/lib/checkout-types";
import type { CheckoutState } from "@/lib/form-state";
import { addDays, currentIsoDate, formatIsoDateLong } from "@/lib/datetime";
import { formatEuro } from "@/lib/money";
import {
  OrderCreationError,
  abandonOrder,
  createOrder,
  getOrderByToken,
  recordPaymentAttempt,
} from "@/lib/orders";
import { getPaymentGateway, paymentMode } from "@/lib/payments";
import { PaymentError } from "@/lib/payments/types";
import { getClosedDates } from "@/lib/settings";
import {
  FULFILLMENT,
  SHOP,
  deliversToPostalCode,
  type FulfillmentType,
} from "@/lib/shop-config";
import { getAvailableSlots, validateSlotSelection } from "@/lib/slots";
import { absoluteUrl, webhookUrl } from "@/lib/site-url";
import { checkoutSchema, fieldErrors } from "@/lib/validation";

function toSlotOptions(
  type: FulfillmentType,
  leadTimeDays: number,
  closedDates: string[],
): SlotOption[] {
  return getAvailableSlots({ type, leadTimeDays, closedDates }).map((slot) => ({
    value: slot.value,
    date: slot.date,
    dateLabel: slot.dateLabel,
    dateLabelShort: slot.dateLabelShort,
    timeLabel: slot.timeLabel,
    label: slot.label,
  }));
}

/**
 * Alles wat de checkout nodig heeft, in één keer opgehaald op basis van de
 * winkelwagen in de browser: doorgerekende lijnen én de momenten die bij de
 * bestelperiode van die producten passen.
 */
export async function getCheckoutData(
  items: Array<Pick<CartItem, "productId" | "quantity">>,
): Promise<CheckoutData> {
  const [cart, closedDates] = await Promise.all([
    priceCart(items),
    getClosedDates(),
  ]);

  const mode = paymentMode();

  return {
    cart,
    slots: {
      pickup: toSlotOptions("pickup", cart.maxLeadTimeDays, closedDates),
      delivery: toSlotOptions("delivery", cart.maxLeadTimeDays, closedDates),
    },
    deliveryFeeCents: FULFILLMENT.deliveryFeeCents,
    deliveryMinimumCents: FULFILLMENT.deliveryMinimumCents,
    deliveryPostalCodes: [...FULFILLMENT.deliveryPostalCodes],
    earliestDate:
      cart.maxLeadTimeDays > 0
        ? addDays(currentIsoDate(), cart.maxLeadTimeDays)
        : null,
    payment: {
      label: mode.label,
      isSandbox: mode.isSandbox,
      isTestKey: mode.isTestKey,
    },
  };
}

function parseItems(raw: FormDataEntryValue | null): Array<{
  productId: string;
  quantity: number;
}> {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is { productId: string; quantity: number } =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as { productId?: unknown }).productId === "string" &&
          Number.isFinite(Number((item as { quantity?: unknown }).quantity)),
      )
      .map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
      }));
  } catch {
    return [];
  }
}

export async function placeOrder(
  _previousState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const parsed = checkoutSchema.safeParse({
    fulfillmentType: formData.get("fulfillmentType"),
    slot: formData.get("slot") ?? "",
    customerName: formData.get("customerName") ?? "",
    customerEmail: formData.get("customerEmail") ?? "",
    customerPhone: formData.get("customerPhone") ?? "",
    street: formData.get("street") ?? "",
    houseNumber: formData.get("houseNumber") ?? "",
    postalCode: formData.get("postalCode") ?? "",
    city: formData.get("city") ?? "",
    deliveryNote: formData.get("deliveryNote") ?? "",
    note: formData.get("note") ?? "",
    acceptTerms: formData.get("acceptTerms") === "on",
  });

  if (!parsed.success) {
    return {
      errors: fieldErrors(parsed.error),
      formError: "Er ontbreekt nog iets. Kijk de gemarkeerde velden na.",
    };
  }

  const values = parsed.data;
  const isDelivery = values.fulfillmentType === "delivery";

  const cart = await priceCart(parseItems(formData.get("items")));
  if (cart.lines.length === 0) {
    return {
      errors: {},
      formError:
        "Je winkelwagen is leeg of de producten zijn niet meer beschikbaar. Voeg opnieuw iets toe.",
    };
  }

  if (cart.notices.length > 0) {
    return {
      errors: {},
      formError: `${cart.notices[0].message} Kijk je winkelwagen even na voor je betaalt.`,
    };
  }

  const closedDates = await getClosedDates();
  const slotCheck = validateSlotSelection({
    type: values.fulfillmentType,
    slotValue: values.slot,
    leadTimeDays: cart.maxLeadTimeDays,
    closedDates,
  });

  if (!slotCheck.ok) {
    return { errors: { slot: slotCheck.reason }, formError: slotCheck.reason };
  }

  const deliveryFeeCents = isDelivery ? FULFILLMENT.deliveryFeeCents : 0;

  if (isDelivery) {
    if (!deliversToPostalCode(values.postalCode)) {
      const message = `We leveren voorlopig enkel in ${FULFILLMENT.deliveryPostalCodes.join(", ")}. Kies afhalen of bel ons op ${SHOP.phone}.`;
      return { errors: { postalCode: message }, formError: message };
    }

    if (
      FULFILLMENT.deliveryMinimumCents > 0 &&
      cart.subtotalCents < FULFILLMENT.deliveryMinimumCents
    ) {
      const message = `Voor levering geldt een minimum van ${formatEuro(FULFILLMENT.deliveryMinimumCents)}. Vul je winkelwagen aan of kies afhalen.`;
      return { errors: {}, formError: message };
    }
  }

  let order;
  try {
    order = await createOrder({
      cart,
      fulfillmentType: values.fulfillmentType,
      slot: slotCheck.slot,
      deliveryFeeCents,
      customer: {
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: values.customerPhone,
        street: isDelivery ? values.street : undefined,
        houseNumber: isDelivery ? values.houseNumber : undefined,
        postalCode: isDelivery ? values.postalCode : undefined,
        city: isDelivery ? values.city : undefined,
        deliveryNote: isDelivery ? values.deliveryNote || undefined : undefined,
        note: values.note || undefined,
      },
    });
  } catch (error) {
    if (error instanceof OrderCreationError) {
      return { errors: {}, formError: error.message };
    }
    console.error("[broodhuis] Bestelling aanmaken mislukte:", error);
    return {
      errors: {},
      formError:
        "We konden je bestelling niet opslaan. Probeer het opnieuw of bel ons.",
    };
  }

  const gateway = getPaymentGateway();
  let checkoutUrl: string;

  try {
    const payment = await gateway.createPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderToken: order.publicToken,
      amountCents: order.totalCents,
      description: `Bestelling ${order.orderNumber} — ${SHOP.legalName}`,
      redirectUrl: absoluteUrl(`/bestelling/${order.publicToken}`),
      cancelUrl: absoluteUrl(`/bestelling/${order.publicToken}?afgebroken=1`),
      webhookUrl: webhookUrl("/api/webhooks/mollie"),
      customerEmail: order.customerEmail,
    });

    await recordPaymentAttempt({
      orderId: order.id,
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
      amountCents: order.totalCents,
      checkoutUrl: payment.checkoutUrl,
      status: payment.status,
      raw: payment.raw,
    });

    checkoutUrl = payment.checkoutUrl;
  } catch (error) {
    await abandonOrder(order.id);
    console.error("[broodhuis] Betaling starten mislukte:", error);
    return {
      errors: {},
      formError:
        error instanceof PaymentError
          ? error.message
          : "De betaling kon niet gestart worden. Probeer het opnieuw of bel ons.",
    };
  }

  redirect(checkoutUrl);
}

/** Nieuwe betaalpoging voor een bestelling die nog niet betaald is. */
export async function retryPayment(publicToken: string): Promise<void> {
  const order = await getOrderByToken(publicToken);

  if (!order) {
    throw new Error("Bestelling niet gevonden.");
  }
  if (order.status === "paid" || order.paymentStatus === "paid") {
    redirect(`/bestelling/${order.publicToken}`);
  }

  const gateway = getPaymentGateway();
  const payment = await gateway.createPayment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderToken: order.publicToken,
    amountCents: order.totalCents,
    description: `Bestelling ${order.orderNumber} — ${SHOP.legalName}`,
    redirectUrl: absoluteUrl(`/bestelling/${order.publicToken}`),
    cancelUrl: absoluteUrl(`/bestelling/${order.publicToken}?afgebroken=1`),
    webhookUrl: webhookUrl("/api/webhooks/mollie"),
    customerEmail: order.customerEmail,
  });

  await recordPaymentAttempt({
    orderId: order.id,
    provider: payment.provider,
    providerPaymentId: payment.providerPaymentId,
    amountCents: order.totalCents,
    checkoutUrl: payment.checkoutUrl,
    status: payment.status,
    raw: payment.raw,
  });

  redirect(payment.checkoutUrl);
}

/** Melding voor de checkout wanneer een product een bestelperiode heeft. */
export async function leadTimeMessage(cart: PricedCart): Promise<string | null> {
  if (cart.maxLeadTimeDays <= 0) return null;
  const earliest = addDays(currentIsoDate(), cart.maxLeadTimeDays);
  return `${cart.leadTimeProductName} moet ${cart.maxLeadTimeDays} dagen vooraf besteld worden. Het vroegste moment is ${formatIsoDateLong(earliest)}.`;
}
