/**
 * Startassortiment voor Bakkerij 't Broodhuis.
 *
 * Run met `npm run seed`. De seed werkt met upserts op de slug, dus je mag
 * hem veilig opnieuw uitvoeren: bestaande producten worden bijgewerkt, wat de
 * bakker zelf toevoegde blijft staan.
 *
 * Prijzen en foto's zijn placeholders — Marie past ze aan via /admin.
 */
import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
});

type CategorySeed = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
};

type ProductSeed = {
  slug: string;
  name: string;
  categorySlug: string;
  description: string;
  ingredients: string;
  allergens: string;
  priceCents: number;
  unit: string;
  imageUrl: string;
  trackStock?: boolean;
  stock?: number;
  leadTimeDays?: number;
  isFeatured?: boolean;
  sortOrder: number;
};

const categories: CategorySeed[] = [
  {
    slug: "brood",
    name: "Brood",
    description:
      "Elke bakdag vers uit de oven. Heel of gesneden, jij kiest bij het afhalen.",
    icon: "🍞",
    sortOrder: 10,
  },
  {
    slug: "klein-brood",
    name: "Klein brood",
    description: "Pistolets, sandwiches en broodjes per zakje.",
    icon: "🥖",
    sortOrder: 20,
  },
  {
    slug: "koffiekoeken",
    name: "Koffiekoeken",
    description: "Boterdeeg met veel laagjes — het lekkerst op zondagmorgen.",
    icon: "🥐",
    sortOrder: 30,
  },
  {
    slug: "patisserie",
    name: "Patisserie",
    description: "Gebak per stuk of hele taarten voor bij de koffie.",
    icon: "🍰",
    sortOrder: 40,
  },
  {
    slug: "feesttaarten",
    name: "Feesttaarten",
    description:
      "Op maat gemaakt voor communie, verjaardag of feest. Tijdig bestellen.",
    icon: "🎂",
    sortOrder: 50,
  },
];

const products: ProductSeed[] = [
  {
    slug: "wit-brood",
    name: "Wit brood",
    categorySlug: "brood",
    description:
      "Ons klassieke witte brood met een dunne, goudbruine korst en een luchtige kruim. Elke bakdag vers gebakken.",
    ingredients:
      "Tarwebloem, water, bakkerszout, gist, tarwemout. Zonder toegevoegde bewaarmiddelen.",
    allergens: "gluten",
    priceCents: 290,
    unit: "per brood",
    imageUrl: "/images/products/wit-brood.jpg",
    isFeatured: true,
    sortOrder: 10,
  },
  {
    slug: "bruin-brood",
    name: "Bruin brood",
    categorySlug: "brood",
    description:
      "Volwaardig bruin brood van tarwebloem en volkorenmeel. Steviger van structuur en blijft langer vers.",
    ingredients:
      "Tarwebloem, volkorentarwemeel, water, bakkerszout, gist, tarwemout.",
    allergens: "gluten",
    priceCents: 310,
    unit: "per brood",
    imageUrl: "/images/products/bruin-brood.jpg",
    isFeatured: true,
    sortOrder: 20,
  },
  {
    slug: "meergranenbrood",
    name: "Meergranenbrood",
    categorySlug: "brood",
    description:
      "Vol van smaak met zonnebloem-, lijn- en sesamzaad. Onze bestseller voor de boterhammen van de week.",
    ingredients:
      "Tarwebloem, volkorentarwemeel, water, meergranenmix (zonnebloemzaad, lijnzaad, sesamzaad, sojaschroot), bakkerszout, gist.",
    allergens: "gluten,soja,sesam",
    priceCents: 360,
    unit: "per brood",
    imageUrl: "/images/products/meergranenbrood.jpg",
    sortOrder: 30,
  },
  {
    slug: "boerenbrood-zuurdesem",
    name: "Boerenbrood op zuurdesem",
    categorySlug: "brood",
    description:
      "Twee dagen rijzen op eigen zuurdesem. Krokante korst, licht zurige kruim, ideaal bij kaas of soep.",
    ingredients:
      "Tarwebloem, roggemeel, water, eigen zuurdesem, bakkerszout. Lange rijs van 24 uur.",
    allergens: "gluten",
    priceCents: 420,
    unit: "per brood",
    imageUrl: "/images/products/boerenbrood-zuurdesem.jpg",
    isFeatured: true,
    sortOrder: 40,
  },
  {
    slug: "pistolets",
    name: "Pistolets",
    categorySlug: "klein-brood",
    description:
      "Knapperige pistolets met een open kruim. Per zakje van zes, klaar voor het weekendontbijt.",
    ingredients: "Tarwebloem, water, bakkerszout, gist, moutbloem.",
    allergens: "gluten",
    priceCents: 300,
    unit: "per 6 stuks",
    imageUrl: "/images/products/pistolets.jpg",
    sortOrder: 10,
  },
  {
    slug: "zachte-sandwiches",
    name: "Zachte sandwiches",
    categorySlug: "klein-brood",
    description:
      "Zacht melkbroodje, licht zoet. Favoriet bij de kinderen, ook lekker met hesp en kaas.",
    ingredients:
      "Tarwebloem, water, volle melk, boter, ei, suiker, gist, bakkerszout.",
    allergens: "gluten,melk,eieren",
    priceCents: 330,
    unit: "per 6 stuks",
    imageUrl: "/images/products/zachte-sandwiches.jpg",
    sortOrder: 20,
  },
  {
    slug: "croissant",
    name: "Croissant",
    categorySlug: "koffiekoeken",
    description:
      "Met echte roomboter getoerd, 27 laagjes. Buiten schilferig, binnen boterzacht.",
    ingredients:
      "Tarwebloem, roomboter, water, volle melk, suiker, ei, gist, bakkerszout.",
    allergens: "gluten,melk,eieren",
    priceCents: 130,
    unit: "per stuk",
    imageUrl: "/images/products/croissant.jpg",
    isFeatured: true,
    sortOrder: 10,
  },
  {
    slug: "chocoladebroodje",
    name: "Chocoladebroodje",
    categorySlug: "koffiekoeken",
    description:
      "Boterdeeg rond twee staafjes pure chocolade. Warm het even op en de chocolade smelt opnieuw.",
    ingredients:
      "Tarwebloem, roomboter, water, volle melk, pure chocolade (cacao 54%, soja-lecithine), suiker, ei, gist, bakkerszout.",
    allergens: "gluten,melk,eieren,soja",
    priceCents: 140,
    unit: "per stuk",
    imageUrl: "/images/products/chocoladebroodje.jpg",
    isFeatured: true,
    sortOrder: 20,
  },
  {
    slug: "rozijnenkoek",
    name: "Rozijnenkoek",
    categorySlug: "koffiekoeken",
    description:
      "Boterdeeg met bakkerscrème en geweekte rozijnen, afgewerkt met een dun laagje glazuur.",
    ingredients:
      "Tarwebloem, roomboter, volle melk, rozijnen (met sulfiet), bakkerscrème (melk, ei, suiker, maïszetmeel), suiker, gist, bakkerszout.",
    allergens: "gluten,melk,eieren,sulfiet",
    priceCents: 140,
    unit: "per stuk",
    imageUrl: "/images/products/rozijnenkoek.jpg",
    sortOrder: 30,
  },
  {
    slug: "rijsttaart",
    name: "Rijsttaart",
    categorySlug: "patisserie",
    description:
      "Klassieke Vlaamse rijsttaart, romig en niet te zoet. Per stuk, uit de vitrine van de dag.",
    ingredients:
      "Tarwebloem, volle melk, rijst, eieren, boter, suiker, vanille, bakkerszout.",
    allergens: "gluten,melk,eieren",
    priceCents: 260,
    unit: "per stuk",
    imageUrl: "/images/products/rijsttaart.jpg",
    trackStock: true,
    stock: 24,
    sortOrder: 10,
  },
  {
    slug: "eclair",
    name: "Éclair",
    categorySlug: "patisserie",
    description:
      "Soezendeeg gevuld met patisseriecrème en afgewerkt met chocoladeglazuur. Beperkt aantal per bakdag.",
    ingredients:
      "Tarwebloem, eieren, boter, volle melk, suiker, pure chocolade (soja-lecithine), vanille.",
    allergens: "gluten,melk,eieren,soja",
    priceCents: 280,
    unit: "per stuk",
    imageUrl: "/images/products/eclair.jpg",
    trackStock: true,
    stock: 18,
    sortOrder: 20,
  },
  {
    slug: "appeltaart",
    name: "Appeltaart",
    categorySlug: "patisserie",
    description:
      "Hele appeltaart met verse Jonagold en kaneel, voor 8 personen. Twee dagen vooraf bestellen.",
    ingredients:
      "Tarwebloem, boter, appel (Jonagold), suiker, eieren, kaneel, amandelpoeder, bakkerszout.",
    allergens: "gluten,melk,eieren,noten",
    priceCents: 1850,
    unit: "voor 8 personen",
    imageUrl: "/images/products/appeltaart.jpg",
    leadTimeDays: 2,
    sortOrder: 30,
  },
  {
    slug: "feesttaart-op-maat",
    name: "Feesttaart op maat",
    categorySlug: "feesttaarten",
    description:
      "Voor communie, verjaardag of jubileum. Kies je vulling en opschrift in het opmerkingenveld bij het afrekenen; wij bellen je om de laatste details af te spreken. Minstens 14 dagen vooraf bestellen.",
    ingredients:
      "Biscuitdeeg (tarwebloem, eieren, suiker), slagroom of botercrème, seizoensfruit, marsepein (amandel). Vulling naar keuze.",
    allergens: "gluten,melk,eieren,noten,soja",
    priceCents: 3200,
    unit: "voor 8 personen",
    imageUrl: "/images/products/feesttaart-op-maat.jpg",
    leadTimeDays: 14,
    sortOrder: 10,
  },
];

async function main() {
  console.log("Assortiment van 't Broodhuis klaarzetten…");

  const categoryIdBySlug = new Map<string, string>();
  for (const category of categories) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      create: category,
      update: {
        name: category.name,
        description: category.description,
        icon: category.icon,
        sortOrder: category.sortOrder,
        isActive: true,
      },
    });
    categoryIdBySlug.set(category.slug, record.id);
  }
  console.log(`  ${categories.length} categorieën`);

  for (const product of products) {
    const categoryId = categoryIdBySlug.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(`Onbekende categorie: ${product.categorySlug}`);
    }

    const fields = { ...product };
    delete (fields as Partial<ProductSeed>).categorySlug;
    const data = {
      ...fields,
      categoryId,
      trackStock: product.trackStock ?? false,
      stock: product.stock ?? 0,
      leadTimeDays: product.leadTimeDays ?? 0,
      isFeatured: product.isFeatured ?? false,
      isActive: true,
    };

    await prisma.product.upsert({
      where: { slug: product.slug },
      create: data,
      update: data,
    });
  }
  console.log(`  ${products.length} producten`);
  console.log("Klaar. Start de webshop met `npm run dev`.");
}

main()
  .catch((error) => {
    console.error("Seed mislukt:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
