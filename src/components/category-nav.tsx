"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

import { CategoryIcon } from "@/components/category-icon";
import { cn } from "@/lib/utils";

export type CategoryNavItem = {
  slug: string;
  name: string;
};

export function CategoryNav({
  items,
  activeSlug,
}: {
  items: CategoryNavItem[];
  activeSlug?: string;
}) {
  const activeRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeSlug]);

  return (
    <nav
      aria-label="Categorieën"
      className="sticky top-16 z-30 -mx-4 mt-6 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur lg:top-[5.5rem] lg:mx-0 lg:border lg:border-border lg:px-3"
    >
      <ul className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
        <li ref={!activeSlug ? activeRef : undefined}>
          <CategoryChip href="/assortiment" active={!activeSlug}>
            Alles
          </CategoryChip>
        </li>
        {items.map((item) => {
          const active = item.slug === activeSlug;
          return (
            <li key={item.slug} ref={active ? activeRef : undefined}>
              <CategoryChip
                href={`/assortiment?categorie=${item.slug}`}
                active={active}
              >
                <CategoryIcon category={item} className="mr-2 size-4" />
                {item.name}
              </CategoryChip>
            </li>
          );
        })}
      </ul>
    </nav>
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
        "inline-flex h-11 items-center border px-4 text-sm font-medium tracking-wide whitespace-nowrap uppercase transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:bg-secondary",
      )}
    >
      {children}
    </Link>
  );
}
