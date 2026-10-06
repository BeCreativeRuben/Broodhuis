import Link from "next/link";

import type { CatalogSubcategory } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function SubcategoryNav({
  groupSlug,
  items,
  activeSlug,
}: {
  groupSlug: string;
  items: CatalogSubcategory[];
  activeSlug?: string;
}) {
  if (items.length === 0) return null;
  const showingAll = !activeSlug || activeSlug === groupSlug;

  return (
    <nav aria-label="Onderverdeling" className="mt-4">
      <ul className="flex gap-2 overflow-x-auto pb-1">
        <li>
          <Link
            href={`/assortiment?categorie=${groupSlug}`}
            className={cn(
              "inline-flex h-11 items-center px-4 text-sm font-medium tracking-wide whitespace-nowrap uppercase",
              showingAll ? "text-foreground underline" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Alles
          </Link>
        </li>
        {items.map((item) => {
          const active = item.slug === activeSlug;
          return (
            <li key={item.slug}>
              <Link
                href={`/assortiment?categorie=${item.slug}`}
                className={cn(
                  "inline-flex h-11 items-center px-4 text-sm font-medium tracking-wide whitespace-nowrap uppercase",
                  active
                    ? "text-foreground underline"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
