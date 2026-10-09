/**
 * Extra productfoto's zonder schemawijziging: imageUrl mag tot drie
 * adressen bevatten, gescheiden door een nieuwe regel of " | ".
 * De eerste is de hoofdfoto; de rest is de galerij.
 */

export const MAX_PRODUCT_IMAGES = 3;

const SEPARATOR = /(?:\r?\n|\s\|\s)/;

export function parseProductImages(raw: string | null | undefined): string[] {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  const urls: string[] = [];
  for (const part of raw.split(SEPARATOR)) {
    const url = part.trim();
    if (url !== "" && !urls.includes(url)) urls.push(url);
    if (urls.length >= MAX_PRODUCT_IMAGES) break;
  }
  return urls;
}

export function primaryProductImage(
  raw: string | null | undefined,
): string | null {
  return parseProductImages(raw)[0] ?? null;
}

export function joinProductImages(urls: Array<string | null | undefined>): string | null {
  const unique: string[] = [];
  for (const url of urls) {
    const trimmed = typeof url === "string" ? url.trim() : "";
    if (trimmed !== "" && !unique.includes(trimmed)) unique.push(trimmed);
    if (unique.length >= MAX_PRODUCT_IMAGES) break;
  }
  return unique.length > 0 ? unique.join("\n") : null;
}

export function isAllowedCustomerPhotoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host.endsWith(".public.blob.vercel-storage.com") ||
      host === "public.blob.vercel-storage.com"
    );
  } catch {
    return false;
  }
}

export function extractPhotoUrls(text: string | null | undefined): string[] {
  if (typeof text !== "string" || text === "") return [];
  const matches = text.match(/https:\/\/[^\s]+/g) ?? [];
  return matches.filter(isAllowedCustomerPhotoUrl);
}
