"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { serialiseAllergens } from "@/lib/allergens";
import { requireAdminSession } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { parseClosedDatesInput, setClosedDates } from "@/lib/settings";
import {
  categorySchema,
  fieldErrors,
  productSchema,
  slugify,
} from "@/lib/validation";

function refreshShop() {
  revalidatePath("/");
  revalidatePath("/assortiment");
}

/** Zoekt een vrije slug: "wit-brood", "wit-brood-2", … */
async function uniqueProductSlug(
  base: string,
  currentId?: string,
): Promise<string> {
  const root = slugify(base) || "product";
  for (let suffix = 0; suffix < 50; suffix += 1) {
    const candidate = suffix === 0 ? root : `${root}-${suffix + 1}`;
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === currentId) return candidate;
  }
  return `${root}-${Date.now()}`;
}

async function uniqueCategorySlug(
  base: string,
  currentId?: string,
): Promise<string> {
  const root = slugify(base) || "categorie";
  for (let suffix = 0; suffix < 50; suffix += 1) {
    const candidate = suffix === 0 ? root : `${root}-${suffix + 1}`;
    const existing = await prisma.category.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === currentId) return candidate;
  }
  return `${root}-${Date.now()}`;
}

export async function saveProduct(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminSession();

  const id = formData.get("id");
  const productId = typeof id === "string" && id !== "" ? id : null;

  const parsed = productSchema.safeParse({
    name: formData.get("name") ?? "",
    slug: formData.get("slug") ?? "",
    categoryId: formData.get("categoryId") ?? "",
    description: formData.get("description") ?? "",
    ingredients: formData.get("ingredients") ?? "",
    allergens: formData.getAll("allergens").map(String),
    price: formData.get("price") ?? "",
    unit: formData.get("unit") ?? "per stuk",
    imageUrl: formData.get("imageUrl") ?? "",
    trackStock: formData.get("trackStock") === "on",
    stock: formData.get("stock") ?? "0",
    leadTimeDays: formData.get("leadTimeDays") ?? "0",
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    sortOrder: formData.get("sortOrder") ?? "0",
  });

  if (!parsed.success) {
    return {
      errors: fieldErrors(parsed.error),
      formError: "Kijk de gemarkeerde velden even na.",
      ok: false,
    };
  }

  const values = parsed.data;

  const category = await prisma.category.findUnique({
    where: { id: values.categoryId },
    select: { id: true },
  });
  if (!category) {
    return {
      errors: { categoryId: "Deze categorie bestaat niet meer." },
      formError: "Kies een bestaande categorie.",
      ok: false,
    };
  }

  const slug = await uniqueProductSlug(
    values.slug || values.name,
    productId ?? undefined,
  );

  const data = {
    name: values.name,
    slug,
    categoryId: values.categoryId,
    description: values.description || null,
    ingredients: values.ingredients || null,
    allergens: serialiseAllergens(values.allergens),
    priceCents: values.price,
    unit: values.unit,
    imageUrl: values.imageUrl || null,
    trackStock: values.trackStock,
    stock: values.trackStock ? values.stock : 0,
    leadTimeDays: values.leadTimeDays,
    isActive: values.isActive,
    isFeatured: values.isFeatured,
    sortOrder: values.sortOrder,
  };

  try {
    if (productId) {
      await prisma.product.update({ where: { id: productId }, data });
    } else {
      await prisma.product.create({ data });
    }
  } catch (error) {
    console.error("[broodhuis] Product opslaan mislukte:", error);
    return {
      errors: {},
      formError: "Het product kon niet opgeslagen worden. Probeer het opnieuw.",
      ok: false,
    };
  }

  refreshShop();
  redirect("/admin/producten?opgeslagen=1");
}

export async function deleteProduct(formData: FormData): Promise<void> {
  await requireAdminSession();

  const id = String(formData.get("id") ?? "");
  if (id === "") return;

  await prisma.product.delete({ where: { id } });
  refreshShop();
  redirect("/admin/producten?verwijderd=1");
}

export async function toggleProductActive(formData: FormData): Promise<void> {
  await requireAdminSession();

  const id = String(formData.get("id") ?? "");
  if (id === "") return;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!product) return;

  await prisma.product.update({
    where: { id },
    data: { isActive: !product.isActive },
  });
  refreshShop();
  revalidatePath("/admin/producten");
}

/** Snel de voorraad bijwerken vanuit de productenlijst. */
export async function updateStock(formData: FormData): Promise<void> {
  await requireAdminSession();

  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("stock") ?? "");
  const stock = Number.parseInt(raw, 10);

  if (id === "" || !Number.isFinite(stock) || stock < 0) return;

  await prisma.product.update({
    where: { id },
    data: { stock: Math.min(stock, 100_000) },
  });
  refreshShop();
  revalidatePath("/admin/producten");
}

export async function saveCategory(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminSession();

  const id = formData.get("id");
  const categoryId = typeof id === "string" && id !== "" ? id : null;

  const parsed = categorySchema.safeParse({
    name: formData.get("name") ?? "",
    slug: formData.get("slug") ?? "",
    description: formData.get("description") ?? "",
    icon: formData.get("icon") ?? "",
    sortOrder: formData.get("sortOrder") ?? "0",
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    return {
      errors: fieldErrors(parsed.error),
      formError: "Kijk de gemarkeerde velden even na.",
      ok: false,
    };
  }

  const values = parsed.data;
  const slug = await uniqueCategorySlug(
    values.slug || values.name,
    categoryId ?? undefined,
  );

  const data = {
    name: values.name,
    slug,
    description: values.description || null,
    icon: values.icon || null,
    sortOrder: values.sortOrder,
    isActive: values.isActive,
  };

  try {
    if (categoryId) {
      await prisma.category.update({ where: { id: categoryId }, data });
    } else {
      await prisma.category.create({ data });
    }
  } catch (error) {
    console.error("[broodhuis] Categorie opslaan mislukte:", error);
    return {
      errors: {},
      formError: "De categorie kon niet opgeslagen worden.",
      ok: false,
    };
  }

  refreshShop();
  redirect("/admin/categorieen?opgeslagen=1");
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await requireAdminSession();

  const id = String(formData.get("id") ?? "");
  if (id === "") return;

  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    redirect("/admin/categorieen?fout=nietleeg");
  }

  await prisma.category.delete({ where: { id } });
  refreshShop();
  redirect("/admin/categorieen?verwijderd=1");
}

export async function saveClosedDates(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdminSession();

  const raw = String(formData.get("closedDates") ?? "");
  const { dates, invalid } = parseClosedDatesInput(raw);

  if (invalid.length > 0) {
    return {
      errors: {
        closedDates: `Deze datums begrijp ik niet: ${invalid.join(", ")}. Gebruik 25/12/2026 of 2026-12-25.`,
      },
      formError: "Sluitingsdagen niet opgeslagen.",
      ok: false,
    };
  }

  await setClosedDates(dates);
  refreshShop();

  return {
    errors: {},
    formError: null,
    ok: true,
  };
}
