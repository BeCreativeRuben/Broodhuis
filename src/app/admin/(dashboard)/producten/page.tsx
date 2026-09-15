import Link from "next/link";
import {
  CalendarClockIcon,
  CheckCircle2Icon,
  EyeOffIcon,
  PencilIcon,
  PlusIcon,
} from "lucide-react";

import { ProductImage } from "@/components/product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { allergenSummary } from "@/lib/allergens";
import { listProductsForAdmin } from "@/lib/admin/catalog";
import { formatEuro } from "@/lib/money";
import { toggleProductActive, updateStock } from "@/server/actions/admin-catalog";

export const dynamic = "force-dynamic";

export const metadata = { title: "Producten" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ opgeslagen?: string; verwijderd?: string }>;
}) {
  const { opgeslagen, verwijderd } = await searchParams;
  const products = await listProductsForAdmin();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            Producten
          </h1>
          <p className="text-sm text-muted-foreground">
            {products.length} producten. Pas prijzen, voorraad, allergenen of
            foto&rsquo;s aan wanneer je wil.
          </p>
        </div>
        <Button
          render={<Link href="/admin/producten/nieuw" />}
          className="h-11 rounded-full px-5"
        >
          <PlusIcon className="size-4" /> Nieuw product
        </Button>
      </header>

      {(opgeslagen || verwijderd) && (
        <p className="flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 p-3 text-sm">
          <CheckCircle2Icon className="size-4 text-success" />
          {opgeslagen ? "Product opgeslagen." : "Product verwijderd."}
        </p>
      )}

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <h2 className="font-heading text-lg font-semibold">
            Nog geen producten
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Voeg je eerste product toe, of zet het startassortiment terug met{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5">npm run seed</code>
            .
          </p>
          <Button
            render={<Link href="/admin/producten/nieuw" />}
            className="mt-4 h-11 rounded-full px-5"
          >
            <PlusIcon className="size-4" /> Nieuw product
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {products.map((product) => {
            const allergens = allergenSummary(product.allergens);
            return (
              <li
                key={product.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.name}
                      sizes="64px"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-base font-semibold">
                        {product.name}
                      </h2>
                      <Badge variant="secondary" className="rounded-full">
                        {product.category.name}
                      </Badge>
                      {!product.isActive && (
                        <Badge
                          variant="outline"
                          className="gap-1 rounded-full text-muted-foreground"
                        >
                          <EyeOffIcon className="size-3" /> niet online
                        </Badge>
                      )}
                      {product.isFeatured && (
                        <Badge className="rounded-full">uitgelicht</Badge>
                      )}
                      {product.leadTimeDays > 0 && (
                        <Badge
                          variant="outline"
                          className="gap-1 rounded-full text-muted-foreground"
                        >
                          <CalendarClockIcon className="size-3" />
                          {product.leadTimeDays} d vooraf
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatEuro(product.priceCents)} {product.unit}
                      {allergens ? ` · ${allergens}` : " · geen allergenen"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {product.trackStock ? (
                      <form
                        action={updateStock}
                        className="flex items-center gap-1.5"
                      >
                        <input type="hidden" name="id" value={product.id} />
                        <label
                          htmlFor={`stock-${product.id}`}
                          className="text-xs text-muted-foreground"
                        >
                          Voorraad
                        </label>
                        <input
                          id={`stock-${product.id}`}
                          name="stock"
                          type="number"
                          min={0}
                          defaultValue={product.stock}
                          className="h-9 w-20 rounded-lg border border-input bg-card px-2 text-sm tabular-nums"
                        />
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                        >
                          Bewaren
                        </Button>
                      </form>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        altijd beschikbaar
                      </span>
                    )}

                    <form action={toggleProductActive}>
                      <input type="hidden" name="id" value={product.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                      >
                        {product.isActive ? "Offline halen" : "Online zetten"}
                      </Button>
                    </form>

                    <Button
                      render={<Link href={`/admin/producten/${product.id}`} />}
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                    >
                      <PencilIcon className="size-3.5" /> Aanpassen
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
