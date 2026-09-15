/**
 * Waarden van het productformulier in de admin.
 *
 * Staat bewust in een gewone module en niet in het "use client"-component:
 * exports van een clientmodule worden op de server een verwijzing in plaats van
 * de echte waarde, waardoor `{ ...NEW_PRODUCT }` een leeg object opleverde.
 */
export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  ingredients: string;
  allergens: string[];
  priceCents: number;
  unit: string;
  imageUrl: string | null;
  trackStock: boolean;
  stock: number;
  leadTimeDays: number;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
};

export const NEW_PRODUCT: ProductFormValues = {
  name: "",
  slug: "",
  categoryId: "",
  description: "",
  ingredients: "",
  allergens: [],
  priceCents: 0,
  unit: "per stuk",
  imageUrl: null,
  trackStock: false,
  stock: 0,
  leadTimeDays: 0,
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
};
