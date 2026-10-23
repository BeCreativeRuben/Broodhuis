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

/** Lokaal bestand dat next/image mag optimaliseren. `//host` is dat niet. */
export function isOptimizableLocalImage(src: string): boolean {
  if (!src.startsWith("/") || src.startsWith("//")) return false;
  if (/[\u0000-\u001F\u007F\\]/.test(src)) return false;

  try {
    const url = new URL(src, "https://broodhuis.invalid");
    if (url.origin !== "https://broodhuis.invalid") return false;
    if (url.username !== "" || url.password !== "") return false;
    return url.pathname.startsWith("/");
  } catch {
    return false;
  }
}

/** Wat de browser mag laden: een lokaal pad, of http(s) zonder userinfo. */
export function isDisplayableImageSrc(src: string): boolean {
  if (isOptimizableLocalImage(src)) return true;
  if (/[\u0000-\u001F\u007F\\]/.test(src)) return false;

  try {
    const url = new URL(src);
    if (url.username !== "" || url.password !== "") return false;
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
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
