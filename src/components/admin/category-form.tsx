"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertTriangleIcon, Loader2Icon, SaveIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EMPTY_FORM_STATE } from "@/lib/form-state";
import { saveCategory } from "@/server/actions/admin-catalog";

export type CategoryFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
};

export function CategoryForm({ values }: { values: CategoryFormValues }) {
  const [state, formAction, isPending] = useActionState(
    saveCategory,
    EMPTY_FORM_STATE,
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-border bg-card p-5"
    >
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <h2 className="font-heading text-lg font-semibold">
        {values.id ? `Categorie aanpassen: ${values.name}` : "Nieuwe categorie"}
      </h2>

      {state.formError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertDescription>{state.formError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-[1fr_6rem_8rem]">
        <div className="grid gap-2">
          <Label htmlFor="name">Naam *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={values.name}
            placeholder="Bv. Seizoen"
            className="h-11"
            required
          />
          {state.errors.name && (
            <p className="text-sm text-destructive">{state.errors.name}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="icon">Icoon</Label>
          <Input
            id="icon"
            name="icon"
            defaultValue={values.icon}
            placeholder="🥨"
            className="h-11 text-center"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sortOrder">Volgorde</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={values.sortOrder}
            className="h-11"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Beschrijving</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={values.description}
          rows={2}
          placeholder="Eén lijn die boven de categorie komt te staan."
        />
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={values.isActive}
          className="size-4 accent-primary"
        />
        Zichtbaar in de webshop
      </label>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending} className="h-11 rounded-full px-5">
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
        {values.id && (
          <Button
            render={<Link href="/admin/categorieen" />}
            variant="ghost"
            className="h-11 rounded-full px-5"
          >
            Nieuwe categorie in plaats daarvan
          </Button>
        )}
      </div>
    </form>
  );
}
