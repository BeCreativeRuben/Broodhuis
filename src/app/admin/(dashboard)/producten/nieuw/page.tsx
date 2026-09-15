import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { ProductForm } from "@/components/admin/product-form";
import { NEW_PRODUCT } from "@/lib/product-form-values";
import { categoryOptions } from "@/lib/admin/catalog";

export const dynamic = "force-dynamic";

export const metadata = { title: "Nieuw product" };

export default async function NewProductPage() {
  const categories = await categoryOptions();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/producten"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeftIcon className="size-4" /> Producten
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold sm:text-3xl">
          Nieuw product
        </h1>
        <p className="text-sm text-muted-foreground">
          Alles wat je hier invult, ziet de klant in de webshop.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="font-medium">Maak eerst een categorie aan</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Elk product hoort in een categorie, bv. Brood of Koffiekoeken.
          </p>
          <Link
            href="/admin/categorieen"
            className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Naar categorieën
          </Link>
        </div>
      ) : (
        <ProductForm
          values={{ ...NEW_PRODUCT, categoryId: categories[0]?.id ?? "" }}
          categories={categories}
        />
      )}
    </div>
  );
}
