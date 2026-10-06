import { parseAllergens, type AllergenCode } from "@/lib/allergens";
import {
  categoryDisplayName,
  compareCategories,
  resolveCategoryGroup,
} from "@/lib/category-groups";
import { prisma } from "@/lib/db";
import { parseOptions, type VariantOptions } from "@/lib/variants";

/**
 * De webshop werkt met eigen, platte types in plaats van rechtstreeks met de
 * Prisma-modellen. Zo blijven de componenten los van het datamodel en kunnen
 * we later van SQLite naar Postgres of naar een andere bron wisselen.
 */
export type CatalogVariant = {
  id: string;
  label: string;
  priceCents: number;
  unit: string;
  options: VariantOptions;
  imageUrl: string | null;
  description: string | null;
  sortOrder: number;
};

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
  /**
   * Leeg voor gewone producten. Bij thee: de smaken van het doosje of blik.
   * Taarten hebben dezelfde tabel, maar die keuzes blijven op hun eigen pagina
   * zoals ze nu verkocht worden.
   */
  variants: CatalogVariant[];
  category: CatalogCategoryRef;
};

export type CatalogCategoryRef = {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  groupSlug: string;
  groupName: string;
};

export type CatalogCategory = CatalogCategoryRef & {
  description: string | null;
  icon: string | null;
  productCount: number;
};

export type CatalogGroup = {
  slug: string;
  name: string;
  description: string | null;
  productCount: number;
  categories: CatalogCategory[];
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

function enrichCategoryRef(category: {
  id: string;
  slug: string;
  name: string;
}): CatalogCategoryRef {
  const group = resolveCategoryGroup(category.slug);
  return {
    ...category,
    displayName: categoryDisplayName(category),
    groupSlug: group.slug,
    groupName: group.name,
  };
}

function toCatalogProduct(
  row: ProductRow,
  variants: CatalogVariant[] = [],
): CatalogProduct {
  return {
    ...row,
    allergens: parseAllergens(row.allergens),
    inStock: !row.trackStock || row.stock > 0,
    variants,
    category: enrichCategoryRef(row.category),
  };
}

/** Alleen thee toont de keuzes in de winkel. Andere varianten blijven onaangeroerd. */
async function variantsFor(rows: ProductRow[]): Promise<Map<string, CatalogVariant[]>> {
  const productIds = rows
    .filter((row) => row.category.slug === "thee")
    .map((row) => row.id);
  const byProduct = new Map<string, CatalogVariant[]>();
  if (productIds.length === 0) return byProduct;

  const variantRows = await prisma.productVariant.findMany({
    where: { productId: { in: productIds }, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
  const sourceSlugs = variantRows.flatMap((variant) =>
    variant.sourceSlug ? [variant.sourceSlug] : [],
  );
  const sources =
    sourceSlugs.length === 0
      ? []
      : await prisma.product.findMany({
          where: { slug: { in: sourceSlugs } },
          select: { slug: true, imageUrl: true, description: true },
        });
  const sourceBySlug = new Map(sources.map((source) => [source.slug, source]));

  for (const variant of variantRows) {
    const source = variant.sourceSlug
      ? sourceBySlug.get(variant.sourceSlug)
      : undefined;
    const list = byProduct.get(variant.productId) ?? [];
    list.push({
      id: variant.id,
      label: variant.label,
      priceCents: variant.priceCents,
      unit: variant.unit,
      options: parseOptions(variant.optionsJson),
      imageUrl: source?.imageUrl ?? null,
      description: source?.description ?? null,
      sortOrder: variant.sortOrder,
    });
    byProduct.set(variant.productId, list);
  }

  return byProduct;
}

async function toCatalogProducts(rows: ProductRow[]): Promise<CatalogProduct[]> {
  const variants = await variantsFor(rows);
  return rows.map((row) => toCatalogProduct(row, variants.get(row.id) ?? []));
}

export async function getVariantRedirect(
  sourceSlug: string,
): Promise<{ productSlug: string; variantId: string } | null> {
  const variant = await prisma.productVariant.findFirst({
    where: { sourceSlug, isActive: true, product: { isActive: true } },
    select: { id: true, product: { select: { slug: true } } },
  });
  if (!variant) return null;
  return { productSlug: variant.product.slug, variantId: variant.id };
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
      ...enrichCategoryRef(category),
      description: category.description,
      icon: category.icon,
      productCount: category._count.products,
    }))
    .filter((category) => category.productCount > 0)
    .sort(compareCategories);
}

export async function getCatalogGroups(): Promise<CatalogGroup[]> {
  const categories = await getActiveCategories();
  const groups = new Map<string, CatalogGroup>();

  for (const category of categories) {
    const existing = groups.get(category.groupSlug);
    if (existing) {
      existing.categories.push(category);
      existing.productCount += category.productCount;
      continue;
    }
    const group = resolveCategoryGroup(category.groupSlug);
    groups.set(category.groupSlug, {
      slug: category.groupSlug,
      name: category.groupName,
      description: group.description ?? category.description,
      productCount: category.productCount,
      categories: [category],
    });
  }

  return [...groups.values()].sort(
    (a, b) =>
      resolveCategoryGroup(a.slug).index - resolveCategoryGroup(b.slug).index,
  );
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

  return toCatalogProducts(rows);
}

export async function getFeaturedProducts(limit = 4): Promise<CatalogProduct[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: limit,
    select: productSelect,
  });

  return toCatalogProducts(rows);
}

export async function getProductBySlug(
  slug: string,
): Promise<CatalogProduct | null> {
  const row = await prisma.product.findFirst({
    where: { slug, isActive: true },
    select: productSelect,
  });

  if (!row) return null;
  const [product] = await toCatalogProducts([row]);
  return product ?? null;
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

  return toCatalogProducts(rows);
}

/** Categorieën met hun producten, in de volgorde die de bakker instelde. */
export async function getCatalogSections(
  categorySlug?: string,
): Promise<Array<{ category: CatalogCategory; products: CatalogProduct[] }>> {
  const [categories, products] = await Promise.all([
    getActiveCategories(),
    getActiveProducts(),
  ]);

  return categories
    .filter((category) => {
      if (!categorySlug) return true;
      return (
        category.slug === categorySlug || category.groupSlug === categorySlug
      );
    })
    .map((category) => ({
      category,
      products: products.filter(
        (product) => product.category.slug === category.slug,
      ),
    }))
    .filter((section) => section.products.length > 0);
}
