import { parseAllergens, type AllergenCode } from "@/lib/allergens";
import {
  categoryDisplayName,
  compareCategories,
  resolveCategoryGroup,
  subcategoryChipName,
  topLevelGroupSlug,
} from "@/lib/category-groups";
import { prisma } from "@/lib/db";
import { resolveProductPhoto } from "@/lib/generated-product-photos";
import {
  baruFlavourKey,
  baruFlavourName,
  cakeAcceptsPhoto,
  cakeExtraOptions,
  choiceButtonLabel,
  isBaruTestzakje,
  isCakeCategory,
  packKindLabel,
  teaFlavourSlug,
  teaPackKind,
  type ExtraOptionSpec,
} from "@/lib/product-options";
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
  /** Ander product in de winkelwagen, bv. BARÚ-zakje of een thee-doosje. */
  cartProductId?: string;
  /** Geen ProductVariant-rij; cart-pricing gebruikt het zusterproduct. */
  virtual?: boolean;
  sourceSlug?: string | null;
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
   * Keuzes bij één product: smaak, verpakking, personen, deeg.
   * Leeg voor gewone producten zonder keuze.
   */
  variants: CatalogVariant[];
  extraOptions: ExtraOptionSpec[];
  acceptsInscription: boolean;
  acceptsPhoto: boolean;
  choiceCta: string;
  category: CatalogCategoryRef;
};

export type CatalogCategoryRef = {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  groupSlug: string;
  groupName: string;
  /** Groep vóór nesten, bv. "thee" onder Confiserie. */
  subSlug: string;
  subName: string;
};

export type CatalogCategory = CatalogCategoryRef & {
  description: string | null;
  icon: string | null;
  productCount: number;
};

export type CatalogSubcategory = {
  slug: string;
  name: string;
};

export type CatalogGroup = {
  slug: string;
  name: string;
  description: string | null;
  productCount: number;
  /** Echte productfoto uit de groep, of null als er geen is. */
  imageUrl: string | null;
  categories: CatalogCategory[];
  subcategories: CatalogSubcategory[];
};

function isRealProductPhoto(url: string | null | undefined): boolean {
  return typeof url === "string" && url.trim() !== "";
}

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
  const topSlug = topLevelGroupSlug(category.slug);
  const top = resolveCategoryGroup(topSlug);
  return {
    ...category,
    displayName: categoryDisplayName(category),
    groupSlug: top.slug,
    groupName: top.name,
    subSlug: group.slug,
    subName: subcategoryChipName(category),
  };
}

function attachChoiceMeta(
  product: CatalogProduct,
  variants: CatalogVariant[],
): CatalogProduct {
  const extras = cakeExtraOptions(
    product.category.groupSlug,
    product.category.slug,
    variants.map((variant) => variant.options),
  );
  const cake = isCakeCategory(product.category.groupSlug, product.category.slug);
  const hasPackChoice = variants.some((variant) => variant.options.verpakking);
  return {
    ...product,
    variants,
    extraOptions: extras,
    acceptsInscription: cake,
    acceptsPhoto: cakeAcceptsPhoto(product.category.groupSlug, product.category.slug),
    choiceCta: choiceButtonLabel({
      categorySlug: product.category.slug,
      groupSlug: product.category.groupSlug,
      hasPackChoice,
    }),
  };
}

function toCatalogProduct(
  row: ProductRow,
  variants: CatalogVariant[] = [],
): CatalogProduct {
  const imageUrl = resolveProductPhoto(row.slug, row.imageUrl);
  const base: CatalogProduct = {
    ...row,
    imageUrl,
    allergens: parseAllergens(row.allergens),
    inStock: !row.trackStock || row.stock > 0,
    variants,
    extraOptions: [],
    acceptsInscription: false,
    acceptsPhoto: false,
    choiceCta: "Kies een optie",
    category: enrichCategoryRef(row.category),
  };
  return attachChoiceMeta(base, variants);
}

/** Alle actieve varianten van de opgevraagde producten. */
async function variantsFor(rows: ProductRow[]): Promise<Map<string, CatalogVariant[]>> {
  const productIds = rows.map((row) => row.id);
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
      imageUrl: resolveProductPhoto(variant.sourceSlug, source?.imageUrl),
      description: source?.description ?? null,
      sortOrder: variant.sortOrder,
      sourceSlug: variant.sourceSlug,
    });
    byProduct.set(variant.productId, list);
  }

  return byProduct;
}

function invertTeaPacks(products: CatalogProduct[]): CatalogProduct[] {
  const packs = products.filter(
    (product) =>
      product.category.slug === "thee" &&
      product.variants.some((variant) => variant.options.smaak),
  );
  if (packs.length === 0) return products;

  const hiddenIds = new Set(packs.map((pack) => pack.id));
  const byFlavour = new Map<
    string,
    { flavour: string; slug: string; variants: CatalogVariant[]; pack: CatalogProduct }
  >();

  for (const pack of packs) {
    const kind = teaPackKind(pack.slug, pack.unit) ?? "doosje";
    const packLabel = packKindLabel(kind);
    for (const variant of pack.variants) {
      const flavour = variant.options.smaak ?? variant.label;
      const existing = byFlavour.get(flavour.toLocaleLowerCase("nl-BE"));
      const flavourSlug =
        existing?.slug ?? teaFlavourSlug(variant.sourceSlug, flavour);
      const next: CatalogVariant = {
        ...variant,
        options: { verpakking: packLabel },
        label: packLabel,
        cartProductId: pack.id,
        sortOrder: kind === "testzakje" ? 10 : kind === "doosje" ? 20 : 30,
      };
      if (existing) {
        existing.variants.push(next);
      } else {
        byFlavour.set(flavour.toLocaleLowerCase("nl-BE"), {
          flavour,
          slug: flavourSlug,
          variants: [next],
          pack,
        });
      }
    }
  }

  const inverted: CatalogProduct[] = [];
  for (const entry of byFlavour.values()) {
    const first = entry.variants[0];
    const image =
      entry.variants.find((variant) => variant.imageUrl)?.imageUrl ??
      entry.pack.imageUrl;
    inverted.push(
      attachChoiceMeta(
        {
          ...entry.pack,
          id: first.cartProductId ?? entry.pack.id,
          slug: entry.slug,
          name: entry.flavour,
          description: "Kies testzakje, doosje of losse thee.",
          imageUrl: image,
          priceCents: Math.min(...entry.variants.map((variant) => variant.priceCents)),
          unit: entry.variants[0]?.unit ?? entry.pack.unit,
          variants: entry.variants.sort((a, b) => a.sortOrder - b.sortOrder),
          extraOptions: [],
          acceptsInscription: false,
          acceptsPhoto: false,
          choiceCta: "Kies een verpakking",
        },
        entry.variants,
      ),
    );
  }

  inverted.sort((a, b) => a.name.localeCompare(b.name, "nl-BE"));
  return [...products.filter((product) => !hiddenIds.has(product.id)), ...inverted];
}

function groupBaruSiblings(products: CatalogProduct[]): CatalogProduct[] {
  const groups = new Map<string, CatalogProduct[]>();
  for (const product of products) {
    const key = baruFlavourKey(product.slug);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(product);
    groups.set(key, list);
  }

  const hidden = new Set<string>();
  const grouped: CatalogProduct[] = [];

  for (const siblings of groups.values()) {
    if (siblings.length < 2) continue;
    const doos =
      siblings.find((product) => !isBaruTestzakje(product.slug)) ?? siblings[0];
    const zakje = siblings.find((product) => isBaruTestzakje(product.slug));
    const variants: CatalogVariant[] = [
      {
        id: `pack:${doos.id}`,
        label: packKindLabel("doos"),
        priceCents: doos.priceCents,
        unit: doos.unit,
        options: { verpakking: packKindLabel("doos") },
        imageUrl: doos.imageUrl,
        description: doos.description,
        sortOrder: 20,
        cartProductId: doos.id,
        virtual: true,
      },
    ];
    if (zakje) {
      variants.unshift({
        id: `pack:${zakje.id}`,
        label: packKindLabel("zakje"),
        priceCents: zakje.priceCents,
        unit: zakje.unit,
        options: { verpakking: packKindLabel("zakje") },
        imageUrl: zakje.imageUrl ?? doos.imageUrl,
        description: zakje.description,
        sortOrder: 10,
        cartProductId: zakje.id,
        virtual: true,
      });
    }
    for (const sibling of siblings) hidden.add(sibling.id);
    grouped.push(
      attachChoiceMeta(
        {
          ...doos,
          name: baruFlavourName(doos.name),
          description: "Kies een zakje (1 portie) of een doos.",
          priceCents: Math.min(...variants.map((variant) => variant.priceCents)),
          variants,
        },
        variants,
      ),
    );
  }

  return [
    ...products.filter((product) => !hidden.has(product.id)),
    ...grouped,
  ];
}

async function toCatalogProducts(rows: ProductRow[]): Promise<CatalogProduct[]> {
  const variants = await variantsFor(rows);
  const products = rows.map((row) =>
    toCatalogProduct(row, variants.get(row.id) ?? []),
  );
  return groupBaruSiblings(invertTeaPacks(products));
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
      imageUrl: null,
      categories: [category],
      subcategories: [],
    });
  }

  for (const group of groups.values()) {
    const seen = new Set<string>();
    const chips: CatalogSubcategory[] = [];
    for (const category of group.categories) {
      const slug = category.subSlug || category.slug;
      if (seen.has(slug)) continue;
      seen.add(slug);
      chips.push({ slug, name: category.subName || category.displayName });
    }
    group.subcategories = chips.length > 1 ? chips : [];
  }

  const photos = await prisma.product.findMany({
    where: {
      isActive: true,
      imageUrl: { not: null },
      category: { isActive: true },
    },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: {
      slug: true,
      imageUrl: true,
      category: { select: { slug: true } },
    },
  });

  for (const product of photos) {
    const imageUrl = resolveProductPhoto(product.slug, product.imageUrl);
    if (!isRealProductPhoto(imageUrl)) continue;
    const groupSlug = topLevelGroupSlug(product.category.slug);
    const existing = groups.get(groupSlug);
    if (existing && !existing.imageUrl) {
      existing.imageUrl = imageUrl;
    }
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

  const products = await toCatalogProducts(rows);
  return products.slice(0, limit);
}

export async function getProductBySlug(
  slug: string,
): Promise<CatalogProduct | null> {
  const row = await prisma.product.findFirst({
    where: { slug, isActive: true },
    select: productSelect,
  });

  const categorySlug =
    row?.category.slug === "thee" ||
    row?.category.slug === "koffie" ||
    slug.startsWith("or-tea-") ||
    slug.startsWith("baru-")
      ? (row?.category.slug ?? (slug.startsWith("baru-") ? "koffie" : "thee"))
      : null;

  if (categorySlug) {
    const siblings = await prisma.product.findMany({
      where: { isActive: true, category: { slug: categorySlug, isActive: true } },
      select: productSelect,
    });
    const catalog = await toCatalogProducts(siblings);
    return (
      catalog.find((product) => product.slug === slug) ??
      (row ? catalog.find((product) => product.id === row.id) : undefined) ??
      null
    );
  }

  if (!row) return null;
  const [product] = await toCatalogProducts([row]);
  return product ?? null;
}

export function productHasChoices(product: CatalogProduct): boolean {
  return (
    product.variants.length > 0 ||
    product.extraOptions.length > 0 ||
    product.acceptsInscription ||
    product.acceptsPhoto
  );
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
        category.slug === categorySlug ||
        category.groupSlug === categorySlug ||
        category.subSlug === categorySlug
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
