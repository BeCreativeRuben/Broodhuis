"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, PhoneIcon } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { CartButton } from "@/components/cart/cart-button";
import { CategoryIcon } from "@/components/category-icon";
import { SocialLinks } from "@/components/social-links";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SHOP } from "@/lib/shop-config";
import { cn } from "@/lib/utils";

type NavCategory = {
  slug: string;
  name: string;
};

const mainLinks = [
  { href: "/bestellen", label: "Bestellen" },
  { href: "/assortiment", label: "Assortiment" },
  { href: "/info", label: "Praktisch" },
];

export function SiteHeader({ categories }: { categories: NavCategory[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="print-hidden sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="page-shell grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-2 lg:h-[5.5rem]">
        <div className="flex items-center gap-1">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-12 rounded-none lg:hidden"
                  aria-label="Menu openen"
                />
              }
            >
              <MenuIcon className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="data-[side=left]:w-[85%]">
              <SheetHeader className="border-b border-border pb-4">
                <SheetTitle>
                  <BrandLogo className="h-8" />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-2">
                {mainLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-12 items-center px-3 py-3 text-base font-medium hover:bg-secondary"
                  >
                    {link.label}
                  </Link>
                ))}
                <p className="eyebrow mt-4 px-3">Categorieën</p>
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/assortiment?categorie=${category.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-12 items-center gap-2.5 px-3 py-3 text-base hover:bg-secondary"
                  >
                    <CategoryIcon
                      category={category}
                      className="size-4 text-crust"
                    />
                    {category.name}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto space-y-2 border-t border-border p-4 text-sm text-muted-foreground">
                <SocialLinks />
                <a
                  href={`tel:${SHOP.phoneHref}`}
                  className="flex items-center gap-2 font-medium text-foreground"
                >
                  <PhoneIcon className="size-4" /> {SHOP.phone}
                </a>
                <p>
                  {SHOP.street}
                  <br />
                  {SHOP.postalCode} {SHOP.city}
                </p>
              </div>
            </SheetContent>
          </Sheet>

          <nav className="hidden items-center gap-1 lg:flex">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex min-h-12 items-center px-3 py-2 text-[13px] font-medium tracking-wide uppercase transition-colors hover:text-foreground",
                  pathname.startsWith(link.href) && "text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-self-center"
          aria-label="Naar de startpagina"
        >
          <BrandLogo priority />
        </Link>

        <div className="flex items-center justify-end gap-1">
          <SocialLinks className="hidden lg:flex" />
          <ButtonLink
            href={`tel:${SHOP.phoneHref}`}
            variant="ghost"
            size="icon"
            className="size-12 rounded-none lg:hidden"
            aria-label={`Bel de bakkerij op ${SHOP.phone}`}
          >
            <PhoneIcon className="size-5" />
          </ButtonLink>
          <CartButton className="rounded-none" />
        </div>
      </div>
    </header>
  );
}
