import type { Metadata } from "next";

import { CartProvider } from "@/components/cart/cart-provider";
import { CartSheet } from "@/components/cart/cart-sheet";
import { MobileCartBar } from "@/components/cart/mobile-cart-bar";
import { NotFoundContent } from "@/components/not-found-content";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Pagina niet gevonden",
  robots: { index: false, follow: false },
};

export default async function RootNotFound() {
  let categories: Array<{ slug: string; name: string }> = [];
  try {
    const { getCatalogGroups } = await import("@/lib/catalog");
    const groups = await getCatalogGroups();
    categories = groups.map((group) => ({
      slug: group.slug,
      name: group.name,
    }));
  } catch {
    categories = [];
  }

  return (
    <CartProvider>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader categories={categories} />
        <main className="flex-1">
          <NotFoundContent />
        </main>
        <SiteFooter />
      </div>
      <CartSheet />
      <MobileCartBar />
    </CartProvider>
  );
}
