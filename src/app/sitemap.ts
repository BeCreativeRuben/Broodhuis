import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const STATIC_PATHS = ["/", "/assortiment", "/info", "/voorwaarden", "/privacy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === "/" || path === "/assortiment" ? "daily" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));

  try {
    const { getActiveProducts, getCatalogGroups } = await import("@/lib/catalog");
    const [groups, products] = await Promise.all([
      getCatalogGroups(),
      getActiveProducts(),
    ]);

    const categoryEntries: MetadataRoute.Sitemap = groups.map((group) => ({
      url: absoluteUrl(`/assortiment?categorie=${group.slug}`),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
      url: absoluteUrl(`/product/${product.slug}`),
      changeFrequency: "weekly",
      priority: 0.5,
    }));

    return [...staticEntries, ...categoryEntries, ...productEntries];
  } catch {
    return staticEntries;
  }
}
