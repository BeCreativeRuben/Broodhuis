import type { Metadata } from "next";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { SHOP } from "@/lib/shop-config";

export const metadata: Metadata = {
  title: "Afrekenen",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="page-shell py-8 pb-32 lg:py-12 lg:pb-12">
      <header className="space-y-2">
        <p className="eyebrow">Stap 2 van 3</p>
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
          Afrekenen
        </h1>
        <p className="max-w-prose text-muted-foreground">
          Kies je moment, vul je gegevens in en betaal met Bancontact of bankkaart.
          Je bestelling ligt vast zodra de betaling gelukt is.
        </p>
      </header>

      <CheckoutForm shopCity={SHOP.city} />
    </div>
  );
}
