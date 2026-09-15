import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon, ExternalLinkIcon, Trash2Icon } from "lucide-react";

import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";
import { categoryOptions, getProductForAdmin } from "@/lib/admin/catalog";
import { parseAllergens } from "@/lib/allergens";
import { deleteProduct } from "@/server/actions/admin-catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductForAdmin(id);
  return { title: product ? product.name : "Product" };
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductForAdmin(id),
    categoryOptions(),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/producten"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeftIcon className="size-4" /> Producten
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            {product.name}
          </h1>
          <Button
            render={
              <Link href={`/product/${product.slug}`} target="_blank" />
            }
            variant="outline"
            size="sm"
            className="rounded-full"
          >
            <ExternalLinkIcon className="size-3.5" /> Bekijk in de webshop
          </Button>
        </div>
      </div>

      <ProductForm
        values={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          categoryId: product.categoryId,
          description: product.description ?? "",
          ingredients: product.ingredients ?? "",
          allergens: parseAllergens(product.allergens),
          priceCents: product.priceCents,
          unit: product.unit,
          imageUrl: product.imageUrl,
          trackStock: product.trackStock,
          stock: product.stock,
          leadTimeDays: product.leadTimeDays,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          sortOrder: product.sortOrder,
        }}
        categories={categories}
      />

      <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
        <h2 className="font-heading text-base font-semibold">
          Product verwijderen
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Wil je het maar even uit de webshop halen? Vink dan hierboven &ldquo;In
          de webshop&rdquo; uit — dan blijft alles bewaard. Verwijderen kan niet
          ongedaan gemaakt worden; oude bestellingen houden wel de naam en prijs
          van toen.
        </p>
        <form action={deleteProduct} className="mt-4">
          <input type="hidden" name="id" value={product.id} />
          <Button type="submit" variant="destructive" className="rounded-full">
            <Trash2Icon className="size-4" /> Definitief verwijderen
          </Button>
        </form>
      </section>
    </div>
  );
}
