"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPinIcon, MenuIcon, PhoneIcon, WheatIcon } from "lucide-react";

import { CartButton } from "@/components/cart/cart-button";
import { Button } from "@/components/ui/button";
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
  icon: string | null;
};

const mainLinks = [
  { href: "/assortiment", label: "Assortiment" },
  { href: "/info", label: "Praktisch" },
];

export function SiteHeader({ categories }: { categories: NavCategory[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="print-hidden sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="hidden border-b border-border/60 bg-secondary/50 lg:block">
        <div className="page-shell flex h-9 items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPinIcon className="size-3.5" />
            {SHOP.street}, {SHOP.postalCode} {SHOP.city}
          </span>
          <span className="inline-flex items-center gap-4">
            <span>Afhalen woensdag t.e.m. zondag</span>
            <span aria-hidden>·</span>
            <span>Leveren donderdag, vrijdag &amp; zondag</span>
            <a
              href={`tel:${SHOP.phoneHref}`}
              className="inline-flex items-center gap-1.5 font-medium text-foreground hover:underline"
            >
              <PhoneIcon className="size-3.5" />
              {SHOP.phone}
            </a>
          </span>
        </div>
      </div>

      <div className="page-shell flex h-16 items-center gap-3 lg:h-20">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-full lg:hidden"
                aria-label="Menu openen"
              />
            }
          >
            <MenuIcon className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="data-[side=left]:w-[85%]">
            <SheetHeader className="border-b border-border pb-4">
              <SheetTitle>
                <span className="font-heading text-lg">{SHOP.name}</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-2">
              {mainLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium hover:bg-secondary"
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
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-base hover:bg-secondary"
                >
                  <span aria-hidden className="text-lg">
                    {category.icon ?? "•"}
                  </span>
                  {category.name}
                </Link>
              ))}
            </nav>
            <div className="mt-auto space-y-1 border-t border-border p-4 text-sm text-muted-foreground">
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

        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground lg:size-11">
            <WheatIcon className="size-5" />
          </span>
          <span className="leading-none">
            <span className="block font-heading text-xl font-semibold tracking-tight lg:text-2xl">
              {SHOP.name}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:block">
              Bakkerij · {SHOP.city}
            </span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary",
                pathname.startsWith(link.href) && "bg-secondary",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            render={<a href={`tel:${SHOP.phoneHref}`} />}
            variant="ghost"
            size="icon"
            className="size-11 rounded-full lg:hidden"
            aria-label={`Bel de bakkerij op ${SHOP.phone}`}
          >
            <PhoneIcon className="size-5" />
          </Button>
          <CartButton />
        </div>
      </div>
    </header>
  );
}
