import "server-only";

import { prisma } from "@/lib/db";

export async function listProductsForAdmin(options?: { categoryId?: string }) {
  return prisma.product.findMany({
    where: options?.categoryId ? { categoryId: options.categoryId } : undefined,
    orderBy: [
      { category: { sortOrder: "asc" } },
      { sortOrder: "asc" },
      { name: "asc" },
    ],
    include: { category: { select: { id: true, name: true, slug: true } } },
  });
}

export async function getProductForAdmin(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  });
}

export async function listCategoriesForAdmin() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
}

export async function categoryOptions() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, isActive: true },
  });
}
