import { parseAllergens, type AllergenCode } from "@/lib/allergens";
import { prisma } from "@/lib/db";

/**
 * De webshop werkt met eigen, platte types in plaats van rechtstreeks met de
 * Prisma-modellen. Zo blijven de componenten los van het datamodel en kunnen
 * we later van SQLite naar Postgres of naar een andere bron wisselen.
 */
export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ingredients: string | null;
  allergens: AllergenCode[];
  priceCents: number;
  unit: string;
  imageUrl: string | null;
  leadTimeDays: number;
  isFeatured: boolean;
  trackStock: boolean;
  stock: number;
  /** Kan de klant dit nu in de winkelwagen leggen? */
  inStock: boolean;
  category: {
    id: string;
    slug: string;
    name: string;
  };
};

export type CatalogCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  productCount: number;
};

const productSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  ingredients: true,
  allergens: true,
  priceCents: true,
  unit: true,
  imageUrl: true,
  leadTimeDays: true,
  isFeatured: true,
  trackStock: true,
  stock: true,
  category: { select: { id: true, slug: true, name: true } },
} as const;

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ingredients: string | null;
  allergens: string;
  priceCents: number;
  unit: string;
  imageUrl: string | null;
  leadTimeDays: number;
  isFeatured: boolean;
  trackStock: boolean;
  stock: number;
  category: { id: string; slug: string; name: string };
};

function toCatalogProduct(row: ProductRow): CatalogProduct {
  return {
    ...row,
    allergens: parseAllergens(row.allergens),
    inStock: !row.trackStock || row.stock > 0,
  };
}

export async function getActiveCategories(): Promise<CatalogCategory[]> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      icon: true,
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });

  return categories
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      icon: category.icon,
      productCount: category._count.products,
    }))
    .filter((category) => category.productCount > 0);
}

export async function getActiveProducts(options?: {
  categorySlug?: string;
}): Promise<CatalogProduct[]> {
  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      category: options?.categorySlug
        ? { slug: options.categorySlug, isActive: true }
        : { isActive: true },
    },
    orderBy: [
      { category: { sortOrder: "asc" } },
      { sortOrder: "asc" },
      { name: "asc" },
    ],
    select: productSelect,
  });

  return rows.map(toCatalogProduct);
}

export async function getFeaturedProducts(limit = 4): Promise<CatalogProduct[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: limit,
    select: productSelect,
  });

  return rows.map(toCatalogProduct);
}

export async function getProductBySlug(
  slug: string,
): Promise<CatalogProduct | null> {
  const row = await prisma.product.findFirst({
    where: { slug, isActive: true },
    select: productSelect,
  });

  return row ? toCatalogProduct(row) : null;
}

export async function getRelatedProducts(
  product: CatalogProduct,
  limit = 4,
): Promise<CatalogProduct[]> {
  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      categoryId: product.category.id,
      id: { not: product.id },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: limit,
    select: productSelect,
  });

  return rows.map(toCatalogProduct);
}

/** Categorieën met hun producten, in de volgorde die de bakker instelde. */
export async function getCatalogSections(categorySlug?: string): Promise<
  Array<{ category: CatalogCategory; products: CatalogProduct[] }>
> {
  const [categories, products] = await Promise.all([
    getActiveCategories(),
    getActiveProducts(),
  ]);

  return categories
    .filter((category) => !categorySlug || category.slug === categorySlug)
    .map((category) => ({
      category,
      products: products.filter(
        (product) => product.category.slug === category.slug,
      ),
    }))
    .filter((section) => section.products.length > 0);
}
