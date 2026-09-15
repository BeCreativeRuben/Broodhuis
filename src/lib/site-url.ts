const DEFAULT_PORT = process.env.PORT ?? "4317";

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

/** Basis-URL van de webshop, gebruikt voor betaal-redirects en webhooks. */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return stripTrailingSlash(configured);

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProduction) return `https://${stripTrailingSlash(vercelProduction)}`;

  const vercelPreview = process.env.VERCEL_URL;
  if (vercelPreview) return `https://${stripTrailingSlash(vercelPreview)}`;

  return `http://localhost:${DEFAULT_PORT}`;
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Mollie moet de webhook kunnen bereiken. Tijdens lokaal testen kan dat via een
 * tunnel; zet dan MOLLIE_WEBHOOK_BASE_URL.
 */
export function webhookUrl(path: string): string | null {
  const base = stripTrailingSlash(
    process.env.MOLLIE_WEBHOOK_BASE_URL?.trim() || siteUrl(),
  );
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  return isPubliclyReachable(base) ? url : null;
}

export function isPubliclyReachable(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "https:" && protocol !== "http:") return false;
    return !(
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname.endsWith(".local")
    );
  } catch {
    return false;
  }
}
