import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  EyeOffIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

import { CategoryForm } from "@/components/admin/category-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { listCategoriesForAdmin } from "@/lib/admin/catalog";
import { deleteCategory } from "@/server/actions/admin-catalog";

export const dynamic = "force-dynamic";

export const metadata = { title: "Categorieën" };

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    id?: string;
    opgeslagen?: string;
    verwijderd?: string;
    fout?: string;
  }>;
}) {
  const { id, opgeslagen, verwijderd, fout } = await searchParams;
  const categories = await listCategoriesForAdmin();
  const editing = id ? categories.find((category) => category.id === id) : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Categorieën
        </h1>
        <p className="text-sm text-muted-foreground">
          Groepen waarin je producten staan. Handig voor seizoenen: maak bv. een
          categorie &ldquo;Kerst&rdquo; en zet ze na de feestdagen op onzichtbaar.
        </p>
      </header>

      {(opgeslagen || verwijderd) && (
        <p className="flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 p-3 text-sm">
          <CheckCircle2Icon className="size-4 text-success" />
          {opgeslagen ? "Categorie opgeslagen." : "Categorie verwijderd."}
        </p>
      )}

      {fout === "nietleeg" && (
        <p className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <AlertTriangleIcon className="size-4 text-destructive" />
          Deze categorie bevat nog producten. Verplaats of verwijder die eerst.
        </p>
      )}

      <CategoryForm
        values={
          editing
            ? {
                id: editing.id,
                name: editing.name,
                slug: editing.slug,
                description: editing.description ?? "",
                icon: editing.icon ?? "",
                sortOrder: editing.sortOrder,
                isActive: editing.isActive,
              }
            : {
                name: "",
                slug: "",
                description: "",
                icon: "",
                sortOrder: (categories.at(-1)?.sortOrder ?? 0) + 10,
                isActive: true,
              }
        }
      />

      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {categories.map((category) => (
          <li key={category.id} className="flex flex-wrap items-center gap-3 p-4">
            <span aria-hidden className="text-2xl">
              {category.icon ?? "•"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{category.name}</span>
                {!category.isActive && (
                  <Badge
                    variant="outline"
                    className="gap-1 rounded-full text-muted-foreground"
                  >
                    <EyeOffIcon className="size-3" /> onzichtbaar
                  </Badge>
                )}
              </span>
              <span className="block text-xs text-muted-foreground">
                {category._count.products}{" "}
                {category._count.products === 1 ? "product" : "producten"} · /
                {category.slug}
              </span>
            </span>

            <ButtonLink
              href={`/admin/categorieen?id=${category.id}`}
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <PencilIcon className="size-3.5" /> Aanpassen
            </ButtonLink>

            {category._count.products === 0 && (
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={category.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-muted-foreground"
                >
                  <Trash2Icon className="size-3.5" /> Verwijderen
                </Button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
