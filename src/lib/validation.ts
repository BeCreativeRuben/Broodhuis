import { z } from "zod";

import { ALLERGENS } from "@/lib/allergens";
import { parseEuroInputToCents } from "@/lib/money";

/** Zet zod-fouten om naar een simpele map per veld, klaar voor het formulier. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

const naam = z
  .string()
  .trim()
  .min(2, "Vul je naam in.")
  .max(80, "Dat is een erg lange naam, kort hem wat in.");

const telefoon = z
  .string()
  .trim()
  .min(6, "Vul een telefoonnummer in waarop we je kunnen bereiken.")
  .max(30, "Dat nummer lijkt niet te kloppen.")
  .regex(
    /^[+]?[\d\s./()-]{6,}$/,
    "Gebruik enkel cijfers, spaties en eventueel een +.",
  );

const email = z
  .string()
  .trim()
  .min(1, "Vul je e-mailadres in.")
  .max(120, "Dat e-mailadres is te lang.")
  .pipe(z.email("Dit e-mailadres lijkt niet te kloppen."));

export const checkoutSchema = z
  .object({
    fulfillmentType: z.enum(["pickup", "delivery"], {
      message: "Kies afhalen of leveren.",
    }),
    slot: z.string().trim().min(1, "Kies een moment."),
    customerName: naam,
    customerEmail: email,
    customerPhone: telefoon,
    street: z.string().trim().max(120).optional().default(""),
    houseNumber: z.string().trim().max(20).optional().default(""),
    postalCode: z.string().trim().max(10).optional().default(""),
    city: z.string().trim().max(80).optional().default(""),
    deliveryNote: z
      .string()
      .trim()
      .max(300, "Hou de bezorginstructies wat korter.")
      .optional()
      .default(""),
    note: z
      .string()
      .trim()
      .max(600, "Hou je opmerking wat korter (max. 600 tekens).")
      .optional()
      .default(""),
    acceptTerms: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.acceptTerms !== true) {
      context.addIssue({
        code: "custom",
        path: ["acceptTerms"],
        message: "Bevestig dat je de bestel- en betaalvoorwaarden aanvaardt.",
      });
    }

    if (values.fulfillmentType !== "delivery") return;

    if (values.street === "") {
      context.addIssue({
        code: "custom",
        path: ["street"],
        message: "Vul de straat in waar we mogen leveren.",
      });
    }
    if (values.houseNumber === "") {
      context.addIssue({
        code: "custom",
        path: ["houseNumber"],
        message: "Vul het huisnummer in.",
      });
    }
    if (!/^\d{4}$/.test(values.postalCode)) {
      context.addIssue({
        code: "custom",
        path: ["postalCode"],
        message: "Een Belgische postcode bestaat uit 4 cijfers.",
      });
    }
    if (values.city === "") {
      context.addIssue({
        code: "custom",
        path: ["city"],
        message: "Vul de gemeente in.",
      });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

const allergenCodes = ALLERGENS.map((allergen) => allergen.code);

const priceField = z
  .string()
  .trim()
  .min(1, "Vul een prijs in.")
  .transform((value, context) => {
    const cents = parseEuroInputToCents(value);
    if (cents === null) {
      context.addIssue({
        code: "custom",
        message: "Gebruik een bedrag zoals 3,50.",
      });
      return z.NEVER;
    }
    if (cents <= 0) {
      context.addIssue({
        code: "custom",
        message: "De prijs moet groter zijn dan 0.",
      });
      return z.NEVER;
    }
    if (cents > 100_000) {
      context.addIssue({ code: "custom", message: "Dat bedrag lijkt te hoog." });
      return z.NEVER;
    }
    return cents;
  });

const optionalNumber = (label: string, max: number) =>
  z
    .string()
    .trim()
    .optional()
    .default("0")
    .transform((value, context) => {
      if (value === "") return 0;
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed) || parsed < 0) {
        context.addIssue({
          code: "custom",
          message: `${label} moet 0 of meer zijn.`,
        });
        return z.NEVER;
      }
      if (parsed > max) {
        context.addIssue({ code: "custom", message: `${label} is te hoog.` });
        return z.NEVER;
      }
      return parsed;
    });

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Geef het product een naam.")
    .max(80, "Hou de naam kort."),
  slug: z
    .string()
    .trim()
    .max(90)
    .optional()
    .default("")
    .refine(
      (value) => value === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
      "Gebruik enkel kleine letters, cijfers en streepjes.",
    ),
  categoryId: z.string().trim().min(1, "Kies een categorie."),
  description: z.string().trim().max(1000).optional().default(""),
  ingredients: z.string().trim().max(2000).optional().default(""),
  allergens: z.array(z.enum(allergenCodes)).optional().default([]),
  price: priceField,
  unit: z.string().trim().min(1, "Vul een eenheid in.").max(40).default("per stuk"),
  imageUrl: z.string().trim().max(2000).optional().default(""),
  imageUrl2: z.string().trim().max(600).optional().default(""),
  imageUrl3: z.string().trim().max(600).optional().default(""),
  trackStock: z.boolean().optional().default(false),
  stock: optionalNumber("Voorraad", 100_000),
  leadTimeDays: optionalNumber("Bestelperiode", 365),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  sortOrder: optionalNumber("Sorteervolgorde", 10_000),
});

export type ProductInput = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Geef de categorie een naam.").max(60),
  slug: z
    .string()
    .trim()
    .max(70)
    .optional()
    .default("")
    .refine(
      (value) => value === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
      "Gebruik enkel kleine letters, cijfers en streepjes.",
    ),
  description: z.string().trim().max(400).optional().default(""),
  icon: z.string().trim().max(8).optional().default(""),
  sortOrder: optionalNumber("Sorteervolgorde", 10_000),
  isActive: z.boolean().optional().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const loginSchema = z.object({
  user: z.string().trim().min(1, "Vul je gebruikersnaam in."),
  password: z.string().min(1, "Vul je wachtwoord in."),
});

/** Maakt van "Feesttaart op maat" -> "feesttaart-op-maat". */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
