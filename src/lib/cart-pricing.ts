import "server-only";

import { parseAllergens } from "@/lib/allergens";
import {
  EMPTY_CART,
  MAX_QUANTITY_PER_LINE,
  type CartNotice,
  type PricedCart,
  type PricedLine,
} from "@/lib/cart";
import { prisma } from "@/lib/db";

function sanitiseQuantity(quantity: unknown): number {
  const parsed =
    typeof quantity === "number" ? quantity : Number.parseInt(String(quantity), 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Math.max(Math.trunc(parsed), 0), MAX_QUANTITY_PER_LINE);
}

/**
 * Rekent de winkelwagen altijd opnieuw door op basis van de database.
 * De browser mag prijzen tonen, maar nooit bepalen: hier gebeurt de waarheid.
 * Producten die verdwenen of uitverkocht zijn, vallen eruit met een melding.
 */
export async function priceCart(
  items: Array<{ productId: string; quantity: number | string }>,
): Promise<PricedCart> {
  const wanted = new Map<string, number>();
  for (const item of items) {
    if (typeof item?.productId !== "string" || item.productId === "") continue;
    const quantity = sanitiseQuantity(item.quantity);
    if (quantity <= 0) continue;
    wanted.set(item.productId, (wanted.get(item.productId) ?? 0) + quantity);
  }

  if (wanted.size === 0) return EMPTY_CART;

  const products = await prisma.product.findMany({
    where: { id: { in: [...wanted.keys()] } },
    select: {
      id: true,
      slug: true,
      name: true,
      unit: true,
      priceCents: true,
      imageUrl: true,
      allergens: true,
      leadTimeDays: true,
      isActive: true,
      trackStock: true,
      stock: true,
      category: { select: { isActive: true } },
    },
  });

  const byId = new Map(products.map((product) => [product.id, product]));
  const lines: PricedLine[] = [];
  const notices: CartNotice[] = [];

  for (const [productId, requested] of wanted) {
    const product = byId.get(productId);

    if (!product || !product.isActive || !product.category.isActive) {
      notices.push({
        kind: "removed",
        message: product
          ? `${product.name} is niet meer beschikbaar en is uit je winkelwagen gehaald.`
          : "Een product uit je winkelwagen bestaat niet meer en is verwijderd.",
      });
      continue;
    }

    const maxQuantity = product.trackStock ? product.stock : null;

    if (maxQuantity !== null && maxQuantity <= 0) {
      notices.push({
        kind: "removed",
        message: `${product.name} is uitverkocht en is uit je winkelwagen gehaald.`,
      });
      continue;
    }

    const quantity =
      maxQuantity !== null ? Math.min(requested, maxQuantity) : requested;

    if (quantity < requested) {
      notices.push({
        kind: "adjusted",
        message: `Van ${product.name} ${
          quantity === 1 ? "is er nog 1 stuk" : `zijn er nog ${quantity} stuks`
        } beschikbaar. We hebben het aantal aangepast.`,
      });
    }

    lines.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      unit: product.unit,
      imageUrl: product.imageUrl,
      unitPriceCents: product.priceCents,
      quantity,
      lineTotalCents: product.priceCents * quantity,
      allergens: parseAllergens(product.allergens),
      leadTimeDays: product.leadTimeDays,
      maxQuantity,
    });
  }

  lines.sort((a, b) => a.name.localeCompare(b.name, "nl-BE"));

  const subtotalCents = lines.reduce(
    (total, line) => total + line.lineTotalCents,
    0,
  );
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);
  const leadTimeLine = lines.reduce<PricedLine | null>(
    (longest, line) =>
      !longest || line.leadTimeDays > longest.leadTimeDays ? line : longest,
    null,
  );

  return {
    lines,
    notices,
    subtotalCents,
    itemCount,
    maxLeadTimeDays: leadTimeLine?.leadTimeDays ?? 0,
    leadTimeProductName:
      leadTimeLine && leadTimeLine.leadTimeDays > 0 ? leadTimeLine.name : null,
  };
}
