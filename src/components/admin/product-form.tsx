"use client";

import { useActionState, useState } from "react";
import { AlertTriangleIcon, Loader2Icon, SaveIcon } from "lucide-react";

import { ImageUpload } from "@/components/admin/image-upload";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ALLERGENS } from "@/lib/allergens";
import { centsToEuroInput } from "@/lib/money";
import type { ProductFormValues } from "@/lib/product-form-values";
import { cn } from "@/lib/utils";
import { EMPTY_FORM_STATE } from "@/lib/form-state";
import { saveProduct } from "@/server/actions/admin-catalog";

export function ProductForm({
  values,
  categories,
}: {
  values: ProductFormValues;
  categories: Array<{ id: string; name: string; isActive: boolean }>;
}) {
  const [state, formAction, isPending] = useActionState(
    saveProduct,
    EMPTY_FORM_STATE,
  );
  const [trackStock, setTrackStock] = useState(values.trackStock);
  const [name, setName] = useState(values.name);
  const errors = state.errors;

  return (
    <form action={formAction} className="space-y-6">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      {state.formError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>Niet opgeslagen</AlertTitle>
          <AlertDescription>{state.formError}</AlertDescription>
        </Alert>
      )}

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Basis</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Naam" name="name" error={errors.name} required>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Bv. Boerenbrood op zuurdesem"
              className="h-11"
              required
            />
          </AdminField>

          <AdminField
            label="Categorie"
            name="categoryId"
            error={errors.categoryId}
            required
          >
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={values.categoryId}
              required
              className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
            >
              <option value="">Kies een categorie…</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.isActive ? "" : " (niet actief)"}
                </option>
              ))}
            </select>
          </AdminField>
        </div>

        <AdminField
          label="Korte beschrijving"
          name="description"
          error={errors.description}
          hint="Twee lijnen die de klant overtuigen. Verschijnt op de productkaart."
        >
          <Textarea
            id="description"
            name="description"
            defaultValue={values.description}
            rows={3}
          />
        </AdminField>

        <div className="grid gap-4 sm:grid-cols-3">
          <AdminField label="Prijs" name="price" error={errors.price} required>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                €
              </span>
              <Input
                id="price"
                name="price"
                defaultValue={
                  values.priceCents > 0 ? centsToEuroInput(values.priceCents) : ""
                }
                inputMode="decimal"
                placeholder="3,50"
                className="h-11 pl-7"
                required
              />
            </div>
          </AdminField>

          <AdminField
            label="Eenheid"
            name="unit"
            error={errors.unit}
            hint="Bv. per brood, per stuk, per 6 stuks"
          >
            <Input
              id="unit"
              name="unit"
              defaultValue={values.unit}
              className="h-11"
              required
            />
          </AdminField>

          <AdminField
            label="Sorteervolgorde"
            name="sortOrder"
            error={errors.sortOrder}
            hint="Laag getal = eerst in de lijst"
          >
            <Input
              id="sortOrder"
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={values.sortOrder}
              className="h-11"
            />
          </AdminField>
        </div>

        <ImageUpload
          name="imageUrl"
          defaultValue={values.imageUrl}
          productName={name}
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">
          Ingrediënten en allergenen
        </h2>

        <AdminField
          label="Ingrediënten"
          name="ingredients"
          error={errors.ingredients}
          hint="Zoals het op het label mag staan. De klant ziet dit op de productpagina."
        >
          <Textarea
            id="ingredients"
            name="ingredients"
            defaultValue={values.ingredients}
            rows={4}
          />
        </AdminField>

        <fieldset>
          <legend className="text-sm font-medium">
            Allergenen{" "}
            <span className="font-normal text-muted-foreground">
              (de 14 wettelijke)
            </span>
          </legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ALLERGENS.map((allergen) => {
              const checked = values.allergens.includes(allergen.code);
              return (
                <label
                  key={allergen.code}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-secondary/60"
                >
                  <input
                    type="checkbox"
                    name="allergens"
                    value={allergen.code}
                    defaultChecked={checked}
                    className="size-4 accent-primary"
                  />
                  {allergen.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Beschikbaarheid</h2>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-secondary/50 p-4 text-sm">
          <input
            type="checkbox"
            name="trackStock"
            defaultChecked={values.trackStock}
            onChange={(event) => setTrackStock(event.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span>
            <span className="block font-medium">Voorraad bijhouden</span>
            <span className="text-muted-foreground">
              Vink dit aan voor producten met een beperkt aantal per bakdag (bv.
              rijsttaarten). Laat het uit voor dagelijks brood: dat blijft altijd te
              bestellen.
            </span>
          </span>
        </label>

        <div
          className={cn("grid gap-4 sm:grid-cols-2", !trackStock && "opacity-60")}
        >
          <AdminField
            label="Voorraad"
            name="stock"
            error={errors.stock}
            hint={
              trackStock
                ? "Aantal dat nu nog besteld kan worden."
                : "Niet van toepassing zolang je geen voorraad bijhoudt."
            }
          >
            <Input
              id="stock"
              name="stock"
              type="number"
              min={0}
              defaultValue={values.stock}
              disabled={!trackStock}
              className="h-11"
            />
          </AdminField>

          <AdminField
            label="Bestelperiode in dagen"
            name="leadTimeDays"
            error={errors.leadTimeDays}
            hint="0 = kan voor de eerstvolgende bakdag. 14 = feesttaart, twee weken vooraf."
          >
            <Input
              id="leadTimeDays"
              name="leadTimeDays"
              type="number"
              min={0}
              defaultValue={values.leadTimeDays}
              className="h-11"
            />
          </AdminField>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={values.isActive}
              className="size-4 accent-primary"
            />
            <span>
              <span className="block font-medium">In de webshop</span>
              <span className="text-muted-foreground">
                Uitvinken haalt het product uit de webshop zonder het te
                verwijderen.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-sm">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={values.isFeatured}
              className="size-4 accent-primary"
            />
            <span>
              <span className="block font-medium">Uitgelicht</span>
              <span className="text-muted-foreground">
                Verschijnt bij &ldquo;Onze klassiekers&rdquo; op de homepage.
              </span>
            </span>
          </label>
        </div>

        <AdminField
          label="Webadres (slug)"
          name="slug"
          error={errors.slug}
          hint="Laat leeg om dit automatisch van de naam te maken."
        >
          <Input
            id="slug"
            name="slug"
            defaultValue={values.slug}
            placeholder="boerenbrood-op-zuurdesem"
            className="h-11"
          />
        </AdminField>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="submit"
          disabled={isPending}
          className="h-12 rounded-full px-6 text-base"
        >
          {isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" /> Bewaren…
            </>
          ) : (
            <>
              <SaveIcon className="size-4" /> Opslaan
            </>
          )}
        </Button>
        <ButtonLink
          href="/admin/producten"
          variant="ghost"
          className="h-12 rounded-full px-6 text-base"
        >
          Annuleren
        </ButtonLink>
      </div>
    </form>
  );
}

function AdminField({
  label,
  name,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
