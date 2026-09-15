/**
 * Volledige bestelflow zonder browser: winkelwagen doorrekenen, moment
 * valideren, bestelling aanmaken, sandboxbetaling starten en op betaald zetten.
 * Handig om na een wijziging snel te controleren of de keten nog klopt.
 *
 * Run met: npx tsx scripts/smoke-order.mts
 */
import "dotenv/config";

import { priceCart } from "../src/lib/cart-pricing";
import { prisma } from "../src/lib/db";
import { formatEuro } from "../src/lib/money";
import {
  applyPaymentUpdate,
  createOrder,
  getOrderByToken,
  recordPaymentAttempt,
} from "../src/lib/orders";
import { getPaymentGateway } from "../src/lib/payments";
import { FULFILLMENT } from "../src/lib/shop-config";
import { getAvailableSlots, validateSlotSelection } from "../src/lib/slots";
import { absoluteUrl } from "../src/lib/site-url";

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    take: 2,
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  if (products.length === 0)
    throw new Error("Geen producten. Run eerst npm run seed.");

  const cart = await priceCart(
    products.map((product) => ({ productId: product.id, quantity: 2 })),
  );
  console.log(
    `1. Winkelwagen: ${cart.itemCount} stuks, ${formatEuro(cart.subtotalCents)}`,
  );

  const slots = getAvailableSlots({
    type: "delivery",
    leadTimeDays: cart.maxLeadTimeDays,
  });
  const chosen = slots[0];
  if (!chosen) throw new Error("Geen leveringsmomenten beschikbaar.");

  const validation = validateSlotSelection({
    type: "delivery",
    slotValue: chosen.value,
    leadTimeDays: cart.maxLeadTimeDays,
  });
  if (!validation.ok) throw new Error(`Moment geweigerd: ${validation.reason}`);
  console.log(`2. Moment: ${validation.slot.label}`);

  const order = await createOrder({
    cart,
    fulfillmentType: "delivery",
    slot: validation.slot,
    deliveryFeeCents: FULFILLMENT.deliveryFeeCents,
    customer: {
      customerName: "Smoke Test",
      customerEmail: "smoke@example.com",
      customerPhone: "052 00 00 00",
      street: "Teststraat",
      houseNumber: "1",
      postalCode: FULFILLMENT.deliveryPostalCodes[0],
      city: "Waasmunster",
      note: "Automatische controle, mag verwijderd worden.",
    },
  });
  console.log(
    `3. Bestelling ${order.orderNumber}: ${formatEuro(order.totalCents)} (incl. ${formatEuro(order.deliveryFeeCents)} levering)`,
  );

  const gateway = getPaymentGateway();
  const payment = await gateway.createPayment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderToken: order.publicToken,
    amountCents: order.totalCents,
    description: `Bestelling ${order.orderNumber}`,
    redirectUrl: absoluteUrl(`/bestelling/${order.publicToken}`),
    cancelUrl: absoluteUrl(`/bestelling/${order.publicToken}?afgebroken=1`),
    webhookUrl: null,
  });
  await recordPaymentAttempt({
    orderId: order.id,
    provider: payment.provider,
    providerPaymentId: payment.providerPaymentId,
    amountCents: order.totalCents,
    checkoutUrl: payment.checkoutUrl,
    status: payment.status,
  });
  console.log(`4. Betaling via ${gateway.label}: ${payment.checkoutUrl}`);

  await applyPaymentUpdate({
    provider: payment.provider,
    providerPaymentId: payment.providerPaymentId,
    status: "paid",
    method: gateway.isSandbox ? "sandbox" : "bancontact",
    paidAt: new Date(),
  });

  // Nog een keer, om te controleren dat verwerken idempotent blijft.
  await applyPaymentUpdate({
    provider: payment.provider,
    providerPaymentId: payment.providerPaymentId,
    status: "paid",
    method: gateway.isSandbox ? "sandbox" : "bancontact",
    paidAt: new Date(),
  });

  const finished = await getOrderByToken(order.publicToken);
  console.log(
    `5. Status: ${finished?.status} / betaling ${finished?.paymentStatus}, ${finished?.items.length} lijnen`,
  );
  console.log(`   Bestelpagina: /bestelling/${order.publicToken}`);

  if (finished?.status !== "paid") {
    throw new Error("De bestelling staat niet op betaald.");
  }
  console.log("\nDe keten werkt.");
}

main()
  .catch((error) => {
    console.error("Controle mislukt:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
