import type { Metadata } from "next";
import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { getActiveCategories, getCatalogSections } from "@/lib/catalog";
import { SHOP } from "@/lib/shop-config";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Assortiment",
  description:
    "Alles wat je bij 't Broodhuis online kan bestellen: brood, klein brood, koffiekoeken, patisserie en feesttaarten.",
};

export default async function AssortimentPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>;
}) {
  const { categorie } = await searchParams;
  const [categories, sections] = await Promise.all([
    getActiveCategories(),
    getCatalogSections(categorie),
  ]);

  const activeCategory = categories.find((category) => category.slug === categorie);
  const isFiltered = Boolean(activeCategory);

  return (
    <div className="page-shell py-8 lg:py-12">
      <header className="max-w-2xl space-y-3">
        <p className="eyebrow">Assortiment</p>
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
          {activeCategory ? activeCategory.name : "Alles van onze bakdagen"}
        </h1>
        <p className="text-muted-foreground">
          {activeCategory?.description ??
            `Kies wat je wil, wij bakken het vers. Bij elk product vind je de ingrediënten en de allergenen. Vragen? Bel ons op ${SHOP.phone}.`}
        </p>
      </header>

      <nav
        aria-label="Categorieën"
        className="sticky top-16 z-30 -mx-4 mt-6 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur lg:top-[7.25rem] lg:mx-0 lg:rounded-full lg:border lg:border-border lg:px-3"
      >
        <ul className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
          <li>
            <CategoryChip href="/assortiment" active={!isFiltered}>
              Alles
            </CategoryChip>
          </li>
          {categories.map((category) => (
            <li key={category.slug}>
              <CategoryChip
                href={`/assortiment?categorie=${category.slug}`}
                active={category.slug === categorie}
              >
                <span aria-hidden className="mr-1">
                  {category.icon}
                </span>
                {category.name}
              </CategoryChip>
            </li>
          ))}
        </ul>
      </nav>

      {sections.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center">
          <h2 className="font-heading text-xl font-semibold">
            Hier staat nog niets
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            In deze categorie zijn er momenteel geen producten. Bekijk het
            volledige assortiment of bel ons voor een bestelling op maat.
          </p>
          <Link
            href="/assortiment"
            className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Volledig assortiment
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-12">
          {sections.map((section, sectionIndex) => (
            <section key={section.category.id} aria-labelledby={section.category.slug}>
              {!isFiltered && (
                <div className="mb-4 flex items-end justify-between gap-3">
                  <h2
                    id={section.category.slug}
                    className="font-heading text-2xl font-semibold"
                  >
                    <span aria-hidden className="mr-2">
                      {section.category.icon}
                    </span>
                    {section.category.name}
                  </h2>
                  <p className="hidden max-w-sm text-sm text-muted-foreground sm:block">
                    {section.category.description}
                  </p>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {section.products.map((product, productIndex) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={sectionIndex === 0 && productIndex < 4}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:bg-secondary",
      )}
    >
      {children}
    </Link>
  );
}
