import type { Metadata } from "next";

import { CartView } from "@/components/cart/cart-view";
import { FULFILLMENT } from "@/lib/shop-config";

export const metadata: Metadata = {
  title: "Winkelwagen",
  robots: { index: false, follow: false },
  alternates: { canonical: "/winkelwagen" },
};

export default function CartPage() {
  return (
    <div className="page-shell py-8 lg:py-12">
      <header className="space-y-2">
        <p className="eyebrow">Stap 1 van 3</p>
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
          Je winkelwagen
        </h1>
      </header>

      <CartView deliveryFeeCents={FULFILLMENT.deliveryFeeCents} />
    </div>
  );
}
