import type { Metadata } from "next";
import Link from "next/link";

import { CategoryIcon } from "@/components/category-icon";
import { CategoryNav } from "@/components/category-nav";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { SubcategoryNav } from "@/components/subcategory-nav";
import { getCatalogGroups, getCatalogSections } from "@/lib/catalog";
import { SHOP } from "@/lib/shop-config";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>;
}): Promise<Metadata> {
  const { categorie } = await searchParams;
  if (!categorie) {
    return {
      title: "Assortiment",
      description:
        "Alles wat je bij 't Broodhuis online kan bestellen: brood, gebak en het winkelassortiment.",
      alternates: { canonical: "/assortiment" },
    };
  }

  const groups = await getCatalogGroups();
  const group = groups.find(
    (entry) =>
      entry.slug === categorie ||
      entry.categories.some((category) => category.slug === categorie),
  );
  const category = group?.categories.find((entry) => entry.slug === categorie);
  const name = group && group.slug === categorie ? group.name : category?.displayName;
  const description =
    group && group.slug === categorie
      ? group.description
      : (category?.description ?? group?.description);

  if (!name) {
    return {
      title: "Assortiment",
      robots: { index: false, follow: true },
      alternates: { canonical: "/assortiment" },
    };
  }

  return {
    title: name,
    description:
      description && description.trim() !== ""
        ? description
        : `${name} bestellen bij Bakkerij 't Broodhuis in ${SHOP.city}.`,
    alternates: { canonical: `/assortiment?categorie=${categorie}` },
  };
}

export default async function AssortimentPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>;
}) {
  const { categorie } = await searchParams;
  const groups = await getCatalogGroups();
  const activeGroup = groups.find(
    (group) =>
      group.slug === categorie ||
      group.categories.some((category) => category.slug === categorie),
  );
  const isFiltered = Boolean(categorie);
  const sections = isFiltered ? await getCatalogSections(categorie) : [];

  const heading = !categorie
    ? "Alles uit de winkel"
    : activeGroup
      ? activeGroup.slug === categorie
        ? activeGroup.name
        : (activeGroup.categories.find((category) => category.slug === categorie)
            ?.displayName ?? activeGroup.name)
      : "Categorie niet gevonden";

  const intro = !categorie
    ? `Kies een categorie. Brood en gebak bakken we vers. Daarnaast neem je thee, dranken, zuivel en ijs mee. Vragen? Bel ons op ${SHOP.phone}.`
    : activeGroup
      ? ((activeGroup.slug === categorie
          ? activeGroup.description
          : activeGroup.categories.find((category) => category.slug === categorie)
              ?.description) ?? activeGroup.description)
      : "Deze categorie bestaat niet of is leeg. Kies een andere of bekijk het overzicht.";

  return (
    <div className="page-shell py-8 lg:py-12">
      <header className="max-w-2xl space-y-3">
        <p className="eyebrow">Assortiment</p>
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
          {heading}
        </h1>
        <p className="text-muted-foreground">{intro}</p>
      </header>

      <CategoryNav
        items={groups.map((group) => ({ slug: group.slug, name: group.name }))}
        activeSlug={categorie ? (activeGroup?.slug ?? categorie) : undefined}
      />

      {activeGroup && isFiltered ? (
        <SubcategoryNav
          groupSlug={activeGroup.slug}
          items={activeGroup.subcategories}
          activeSlug={categorie}
        />
      ) : null}

      {!isFiltered ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {groups.map((group) => (
            <Link
              key={group.slug}
              href={`/assortiment?categorie=${group.slug}`}
              className="group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <div className="relative aspect-square overflow-hidden">
                {group.imageUrl ? (
                  <ProductImage
                    src={group.imageUrl}
                    alt=""
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-background">
                    <CategoryIcon
                      category={{ slug: group.slug, name: group.name }}
                      className="size-6 text-crust/40"
                    />
                  </div>
                )}
              </div>
              <p className="mt-2 font-heading text-base font-semibold group-hover:underline sm:text-lg">
                {group.name}
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {group.productCount}{" "}
                {group.productCount === 1 ? "product" : "producten"}
              </p>
            </Link>
          ))}
        </div>
      ) : sections.length === 0 ? (
        <div className="mt-12 py-6 text-center">
          <h2 className="font-heading text-xl font-semibold">
            Hier staat nog niets
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            In deze categorie zijn er momenteel geen producten. Bekijk het
            volledige assortiment of bel ons voor een bestelling op maat.
          </p>
          <Link
            href="/assortiment"
            className="mt-4 inline-flex h-12 min-h-12 items-center bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Volledig assortiment
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-12">
          {sections.map((section, sectionIndex) => (
            <section
              key={section.category.id}
              aria-labelledby={section.category.slug}
            >
              {sections.length > 1 && (
                <div className="mb-4 flex items-end justify-between gap-3">
                  <h2
                    id={section.category.slug}
                    className="flex items-center gap-2.5 font-heading text-2xl font-semibold"
                  >
                    <CategoryIcon
                      category={section.category}
                      className="size-5 text-crust"
                    />
                    {section.category.displayName}
                  </h2>
                  <p className="hidden max-w-sm text-sm text-muted-foreground sm:block">
                    {section.category.description}
                  </p>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {section.products.map((product, productIndex) => (
                  <ProductCard
                    key={product.slug}
                    product={product}
                    priority={sectionIndex === 0 && productIndex === 0}
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
