import { CartProvider } from "@/components/cart/cart-provider";
import { CartSheet } from "@/components/cart/cart-sheet";
import { MobileCartBar } from "@/components/cart/mobile-cart-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getActiveCategories } from "@/lib/catalog";

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
        <main className="flex-1 pb-mobile-bar">{children}</main>
        <SiteFooter />
      </div>
      <CartSheet />
      <MobileCartBar />
    </CartProvider>
  );
}
