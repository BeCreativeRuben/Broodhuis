import { CartProvider } from "@/components/cart/cart-provider";
import { CartSheet } from "@/components/cart/cart-sheet";
import { MobileCartBar } from "@/components/cart/mobile-cart-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getActiveCategories } from "@/lib/catalog";

/**
 * De categorienavigatie komt uit de database, dus deze schil (en alles
 * eronder) wordt per aanvraag opgebouwd. Zonder dit probeert `next build`
 * pagina's vooraf te renderen en faalt de build op een machine zonder
 * database — bv. in CI.
 */
export const dynamic = "force-dynamic";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getActiveCategories();

  return (
    <CartProvider>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader
          categories={categories.map((category) => ({
            slug: category.slug,
            name: category.name,
            icon: category.icon,
          }))}
        />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
      <CartSheet />
      <MobileCartBar />
    </CartProvider>
  );
}
