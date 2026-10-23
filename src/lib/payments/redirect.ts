/**
 * De klant mag alleen naar Mollie of naar onze eigen testbetaalpagina.
 * Een andere host in de betaallink wordt niet gevolgd.
 */
export function isAllowedPaymentRedirect(url: string, siteBase: string): boolean {
  if (url.length === 0 || url.length > 2000) return false;
  if (/[\u0000-\u001F\u007F\\]/.test(url)) return false;

  let target: URL;
  let site: URL;
  try {
    target = new URL(url);
    site = new URL(siteBase);
  } catch {
    return false;
  }

  if (target.username !== "" || target.password !== "") return false;
  if (target.protocol !== "http:" && target.protocol !== "https:") return false;

  const host = target.hostname.toLowerCase();
  if (host === "mollie.com" || host.endsWith(".mollie.com")) {
    return target.protocol === "https:";
  }

  if (target.origin !== site.origin) return false;
  return target.pathname.startsWith("/betaling/sandbox/");
}
