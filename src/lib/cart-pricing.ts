import "server-only";

import { parseAllergens } from "@/lib/allergens";
import {
  cartLineKey,
  EMPTY_CART,
  MAX_QUANTITY_PER_LINE,
  type CartNotice,
  type PricedCart,
  type PricedLine,
} from "@/lib/cart";
import { prisma } from "@/lib/db";
import { portionUnit, portionUnitPriceCents } from "@/lib/weight";

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
  items: Array<{
    productId: string;
    quantity: number | string;
    variantId?: string | null;
  }>,
): Promise<PricedCart> {
  const wanted = new Map<
    string,
    { productId: string; variantId?: string; quantity: number }
  >();
  for (const item of items) {
    if (typeof item?.productId !== "string" || item.productId === "") continue;
    const quantity = sanitiseQuantity(item.quantity);
    if (quantity <= 0) continue;
    const variantId =
      typeof item.variantId === "string" && item.variantId !== ""
        ? item.variantId
        : undefined;
    const key = cartLineKey({ productId: item.productId, variantId });
    const existing = wanted.get(key);
    if (existing) existing.quantity += quantity;
    else wanted.set(key, { productId: item.productId, variantId, quantity });
  }

  if (wanted.size === 0) return EMPTY_CART;

  const products = await prisma.product.findMany({
    where: { id: { in: [...wanted.values()].map((line) => line.productId) } },
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

  const variantIds = [...wanted.values()].flatMap((line) =>
    line.variantId ? [line.variantId] : [],
  );
  const variantRows =
    variantIds.length === 0
      ? []
      : await prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
        });
  const variantById = new Map(variantRows.map((variant) => [variant.id, variant]));
  const sourceSlugs = variantRows.flatMap((variant) =>
    variant.sourceSlug ? [variant.sourceSlug] : [],
  );
  const sources =
    sourceSlugs.length === 0
      ? []
      : await prisma.product.findMany({
          where: { slug: { in: sourceSlugs } },
          select: { slug: true, imageUrl: true },
        });
  const imageBySlug = new Map(sources.map((source) => [source.slug, source.imageUrl]));

  const byId = new Map(products.map((product) => [product.id, product]));
  const lines: PricedLine[] = [];
  const notices: CartNotice[] = [];

  for (const [, request] of wanted) {
    const requested = request.quantity;
    const product = byId.get(request.productId);

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

    const variant = request.variantId
      ? variantById.get(request.variantId)
      : undefined;
    if (
      request.variantId &&
      (!variant || !variant.isActive || variant.productId !== product.id)
    ) {
      notices.push({
        kind: "removed",
        message: `Een gekozen smaak van ${product.name} is niet meer beschikbaar en is uit je winkelwagen gehaald.`,
      });
      continue;
    }

    const rawUnit = variant?.unit ?? product.unit;
    const rawPriceCents = variant?.priceCents ?? product.priceCents;
    const unitPriceCents = portionUnitPriceCents(rawPriceCents, rawUnit);
    const unit = portionUnit(rawUnit);
    const name = variant ? `${product.name} — ${variant.label}` : product.name;
    const imageUrl =
      (variant?.sourceSlug ? imageBySlug.get(variant.sourceSlug) : null) ??
      product.imageUrl;

    lines.push({
      productId: product.id,
      variantId: variant?.id,
      variantLabel: variant?.label ?? null,
      slug: product.slug,
      name,
      unit,
      imageUrl,
      unitPriceCents,
      quantity,
      lineTotalCents: unitPriceCents * quantity,
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
