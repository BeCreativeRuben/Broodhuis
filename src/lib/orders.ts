import type { Prisma } from "@/generated/prisma/client";
import { serialiseAllergens } from "@/lib/allergens";
import type { PricedCart } from "@/lib/cart";
import { currentIsoDate, type IsoDate } from "@/lib/datetime";
import { prisma } from "@/lib/db";
import { paymentGatewayById } from "@/lib/payments";
import type { FetchedPayment, PaymentStatus } from "@/lib/payments/types";
import type { FulfillmentType } from "@/lib/shop-config";
import type { Slot } from "@/lib/slots";

/** Status van de bestelling zelf, los van de betaalstatus. */
export type OrderStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "ready"
  | "completed";

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "paid",
  "ready",
  "completed",
  "cancelled",
  "failed",
];

export function orderStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Wacht op betaling";
    case "paid":
      return "Betaald";
    case "ready":
      return "Klaar";
    case "completed":
      return "Afgehandeld";
    case "cancelled":
      return "Geannuleerd";
    case "failed":
      return "Niet doorgegaan";
    default:
      return status;
  }
}

export type CustomerDetails = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  deliveryNote?: string;
  note?: string;
};

export type CreateOrderInput = {
  cart: PricedCart;
  fulfillmentType: FulfillmentType;
  slot: Slot;
  deliveryFeeCents: number;
  customer: CustomerDetails;
};

export class OrderCreationError extends Error {}

function orderNumberPrefix(now: Date): string {
  const isoDate = currentIsoDate(now);
  const [year, month, day] = isoDate.split("-");
  return `BH-${year.slice(2)}${month}${day}`;
}

async function nextOrderNumber(
  tx: Prisma.TransactionClient,
  now: Date,
): Promise<string> {
  const prefix = orderNumberPrefix(now);
  const latest = await tx.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  const previous = latest
    ? Number.parseInt(latest.orderNumber.slice(prefix.length + 1), 10)
    : 0;
  const sequence = Number.isFinite(previous) ? previous + 1 : 1;
  return `${prefix}-${String(sequence).padStart(4, "0")}`;
}

/**
 * Maakt de bestelling aan en houdt meteen voorraad bij voor producten met
 * voorraadbeheer. Loopt de betaling verkeerd af, dan geeft
 * `releaseReservedStock` de stuks weer vrij.
 */
export async function createOrder(input: CreateOrderInput) {
  const { cart, slot, fulfillmentType, customer, deliveryFeeCents } = input;

  if (cart.lines.length === 0) {
    throw new OrderCreationError("Je winkelwagen is leeg.");
  }

  const subtotalCents = cart.subtotalCents;
  const totalCents = subtotalCents + deliveryFeeCents;
  const now = new Date();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Voorraad nog één keer nakijken binnen de transactie.
        for (const line of cart.lines) {
          const product = await tx.product.findUnique({
            where: { id: line.productId },
            select: { name: true, isActive: true, trackStock: true, stock: true },
          });

          if (!product || !product.isActive) {
            throw new OrderCreationError(
              `${line.name} is niet meer beschikbaar. Pas je winkelwagen aan.`,
            );
          }

          if (product.trackStock) {
            if (product.stock < line.quantity) {
              throw new OrderCreationError(
                `Van ${product.name} ${product.stock === 0 ? "is er niets meer" : `zijn er nog maar ${product.stock} beschikbaar`}. Pas je winkelwagen aan.`,
              );
            }
            await tx.product.update({
              where: { id: line.productId },
              data: { stock: { decrement: line.quantity } },
            });
          }
        }

        return tx.order.create({
          data: {
            orderNumber: await nextOrderNumber(tx, now),
            publicToken: crypto.randomUUID().replace(/-/g, ""),
            status: "pending",
            fulfillmentType,
            slotDate: slot.date,
            slotId: slot.windowId,
            slotLabel: slot.label,
            customerName: customer.customerName,
            customerEmail: customer.customerEmail,
            customerPhone: customer.customerPhone,
            street: customer.street ?? null,
            houseNumber: customer.houseNumber ?? null,
            postalCode: customer.postalCode ?? null,
            city: customer.city ?? null,
            deliveryNote: customer.deliveryNote ?? null,
            note: customer.note ?? null,
            subtotalCents,
            deliveryFeeCents,
            totalCents,
            paymentStatus: "open",
            items: {
              create: cart.lines.map((line) => ({
                productId: line.productId,
                name: line.name,
                unit: line.unit,
                unitPriceCents: line.unitPriceCents,
                quantity: line.quantity,
                lineTotalCents: line.lineTotalCents,
                allergens: serialiseAllergens(line.allergens),
              })),
            },
          },
          include: { items: true },
        });
      });
    } catch (error) {
      if (error instanceof OrderCreationError) throw error;
      const isDuplicateOrderNumber =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "P2002";
      if (!isDuplicateOrderNumber || attempt === 4) throw error;
    }
  }

  throw new OrderCreationError(
    "We konden geen bestelnummer aanmaken. Probeer het opnieuw.",
  );
}

export async function recordPaymentAttempt(params: {
  orderId: string;
  provider: string;
  providerPaymentId: string;
  amountCents: number;
  checkoutUrl: string;
  status: PaymentStatus;
  raw?: unknown;
}) {
  const payment = await prisma.payment.create({
    data: {
      orderId: params.orderId,
      provider: params.provider,
      providerPaymentId: params.providerPaymentId,
      status: params.status,
      amountCents: params.amountCents,
      checkoutUrl: params.checkoutUrl,
      rawPayload: params.raw ? JSON.stringify(params.raw).slice(0, 8000) : null,
    },
  });

  await prisma.order.update({
    where: { id: params.orderId },
    data: {
      paymentProvider: params.provider,
      paymentStatus: params.status,
    },
  });

  return payment;
}

/** Geeft gereserveerde stuks terug aan de voorraad, hoogstens één keer. */
async function releaseReservedStock(tx: Prisma.TransactionClient, orderId: string) {
  const items = await tx.orderItem.findMany({
    where: { orderId, productId: { not: null } },
    select: { productId: true, quantity: true },
  });

  for (const item of items) {
    if (!item.productId) continue;
    const product = await tx.product.findUnique({
      where: { id: item.productId },
      select: { trackStock: true },
    });
    if (product?.trackStock) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  }
}

function orderStatusForPayment(status: PaymentStatus): OrderStatus | null {
  switch (status) {
    case "paid":
      return "paid";
    case "failed":
    case "expired":
      return "failed";
    case "canceled":
      return "cancelled";
    default:
      return null;
  }
}

/**
 * Verwerkt een betaalstatus. Idempotent: de webhook van de provider én de
 * terugkeerpagina van de klant mogen dit allebei (en meermaals) aanroepen.
 */
export async function applyPaymentUpdate(fetched: FetchedPayment) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { providerPaymentId: fetched.providerPaymentId },
      include: { order: { select: { id: true, status: true } } },
    });

    if (!payment) return null;

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: fetched.status,
        method: fetched.method ?? payment.method,
        rawPayload: fetched.raw
          ? JSON.stringify(fetched.raw).slice(0, 8000)
          : payment.rawPayload,
      },
    });

    const nextOrderStatus = orderStatusForPayment(fetched.status);
    const orderIsOpen = payment.order.status === "pending";

    // Alleen een bestelling die nog op betaling wacht mag van status wijzigen.
    if (nextOrderStatus && orderIsOpen) {
      if (nextOrderStatus === "failed" || nextOrderStatus === "cancelled") {
        await releaseReservedStock(tx, payment.orderId);
      }

      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: nextOrderStatus,
          paymentStatus: fetched.status,
          paymentMethod: fetched.method ?? undefined,
          paidAt:
            fetched.status === "paid" ? (fetched.paidAt ?? new Date()) : null,
        },
      });
    } else {
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: fetched.status,
          paymentMethod: fetched.method ?? undefined,
        },
      });
    }

    return tx.order.findUnique({
      where: { id: payment.orderId },
      include: { items: true, payments: { orderBy: { createdAt: "desc" } } },
    });
  });
}

/**
 * Haalt de actuele status bij de provider op en verwerkt die.
 * Zo klopt de bestelpagina ook als de webhook (nog) niet toekwam — bv. lokaal,
 * waar Mollie localhost niet kan bereiken.
 */
export async function syncOrderPayment(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const payment = order?.payments[0];
  if (!order || !payment) return null;
  if (order.status !== "pending") return null;

  const gateway = paymentGatewayById(payment.provider);
  if (!gateway) return null;

  try {
    const fetched = await gateway.fetchPayment(payment.providerPaymentId);
    if (fetched.status === payment.status) return null;
    return await applyPaymentUpdate(fetched);
  } catch (error) {
    console.error("[broodhuis] Betaalstatus ophalen mislukte:", error);
    return null;
  }
}

export async function markSandboxPayment(
  providerPaymentId: string,
  status: Extract<PaymentStatus, "paid" | "failed" | "canceled">,
) {
  const payment = await prisma.payment.findUnique({
    where: { providerPaymentId },
    select: { provider: true },
  });

  if (!payment || payment.provider !== "sandbox") {
    throw new Error("Deze testbetaling bestaat niet.");
  }

  return applyPaymentUpdate({
    provider: "sandbox",
    providerPaymentId,
    status,
    method: "sandbox",
    paidAt: status === "paid" ? new Date() : null,
    raw: { simulated: true, status },
  });
}

/**
 * Loopt het aanmaken van de betaling mis, dan blijft er geen bestelling
 * hangen die voorraad vasthoudt.
 */
export async function abandonOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });
    if (!order || order.status !== "pending") return;

    await releaseReservedStock(tx, orderId);
    await tx.order.update({
      where: { id: orderId },
      data: { status: "failed", paymentStatus: "failed" },
    });
  });
}

export async function getOrderByNumber(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: { orderBy: { name: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
}

/** De klant bekijkt zijn bestelling via de onvoorspelbare publicToken. */
export async function getOrderByToken(publicToken: string) {
  return prisma.order.findUnique({
    where: { publicToken },
    include: {
      items: { orderBy: { name: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
}

export type CustomerOrder = NonNullable<
  Awaited<ReturnType<typeof getOrderByToken>>
>;

export type OrderListFilters = {
  status?: OrderStatus | "open";
  fulfillmentType?: FulfillmentType;
  slotDate?: IsoDate;
  search?: string;
};

export async function listOrders(filters: OrderListFilters = {}) {
  const where: Prisma.OrderWhereInput = {};

  if (filters.status === "open") {
    where.status = { in: ["pending", "paid", "ready"] };
  } else if (filters.status) {
    where.status = filters.status;
  }

  if (filters.fulfillmentType) where.fulfillmentType = filters.fulfillmentType;
  if (filters.slotDate) where.slotDate = filters.slotDate;

  if (filters.search) {
    const search = filters.search.trim();
    if (search !== "") {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
        { customerPhone: { contains: search } },
      ];
    }
  }

  return prisma.order.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take: 200,
    include: { items: { select: { id: true, name: true, quantity: true } } },
  });
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { name: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!order) throw new Error("Bestelling niet gevonden.");

    // Bij annuleren gaan gereserveerde stuks terug naar de voorraad.
    if (
      status === "cancelled" &&
      order.status !== "cancelled" &&
      order.status !== "failed"
    ) {
      await releaseReservedStock(tx, id);
    }

    return tx.order.update({ where: { id }, data: { status } });
  });
}

/** Cijfers voor het admin-dashboard. */
export async function getAdminStats() {
  const today = currentIsoDate();

  const [openOrders, paidToday, upcoming, lowStock, productCount] =
    await Promise.all([
      prisma.order.count({ where: { status: { in: ["pending"] } } }),
      prisma.order.count({
        where: { status: { in: ["paid", "ready"] }, slotDate: { gte: today } },
      }),
      prisma.order.findMany({
        where: {
          status: { in: ["paid", "ready"] },
          slotDate: { gte: today },
        },
        orderBy: [{ slotDate: "asc" }],
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          slotDate: true,
          slotLabel: true,
          fulfillmentType: true,
          totalCents: true,
        },
      }),
      prisma.product.findMany({
        where: { isActive: true, trackStock: true, stock: { lte: 5 } },
        orderBy: { stock: "asc" },
        take: 5,
        select: { id: true, name: true, stock: true },
      }),
      prisma.product.count({ where: { isActive: true } }),
    ]);

  return { openOrders, paidToday, upcoming, lowStock, productCount };
}
