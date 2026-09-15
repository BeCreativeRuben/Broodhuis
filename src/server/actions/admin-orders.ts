"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/auth/server";
import { ORDER_STATUS_FLOW, updateOrderStatus, type OrderStatus } from "@/lib/orders";

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUS_FLOW as string[]).includes(value);
}

export async function setOrderStatus(formData: FormData): Promise<void> {
  await requireAdminSession();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (id === "" || !isOrderStatus(status)) return;

  await updateOrderStatus(id, status);
  revalidatePath("/admin/bestellingen");
  revalidatePath(`/admin/bestellingen/${id}`);
  revalidatePath("/admin");
}
