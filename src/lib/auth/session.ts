/**
 * Admin-sessie zonder externe afhankelijkheden: een JSON-payload met een
 * HMAC-SHA256 signatuur, in een httpOnly cookie. Werkt met de Web Crypto API
 * en dus zowel in de Next.js middleware als in server components/actions.
 *
 * Wil je later meerdere medewerkers met eigen login? Vervang dit door
 * NextAuth (credentials provider) of Auth.js; de rest van de admin blijft
 * werken zolang `getAdminSession()` een sessie teruggeeft.
 */

export const ADMIN_COOKIE_NAME = "broodhuis_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 uur

const DEV_FALLBACK = {
  user: "marie",
  password: "broodhuis",
  secret: "broodhuis-dev-secret-niet-voor-productie",
};

export type AdminSession = {
  user: string;
  /** Unix-tijd in seconden */
  exp: number;
};

/**
 * De vaste dev-login mag alleen op een gewone ontwikkelmachine. Productie én
 * een publieke Vercel-preview vallen dicht als het wachtwoord ontbreekt.
 */
export function allowsDevAuthFallback(
  env: { NODE_ENV?: string; VERCEL_ENV?: string } = process.env,
): boolean {
  if (env.NODE_ENV === "production") return false;
  if (env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview") return false;
  return true;
}

/**
 * In ontwikkeling werkt de admin meteen met marie/broodhuis, zodat de webshop
 * out of the box te testen is. In productie is een expliciete configuratie
 * verplicht: zonder ADMIN_PASSWORD en ADMIN_SESSION_SECRET kan niemand in.
 */
export function adminAuthConfig(): {
  user: string;
  password: string;
  secret: string;
  configured: boolean;
  usingDevFallback: boolean;
} {
  const user = process.env.ADMIN_USER?.trim() || "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";

  const hasAll = user !== "" && password !== "" && secret !== "";
  if (hasAll) {
    return { user, password, secret, configured: true, usingDevFallback: false };
  }

  if (!allowsDevAuthFallback()) {
    return {
      user,
      password,
      secret,
      configured: false,
      usingDevFallback: false,
    };
  }

  return {
    user: user || DEV_FALLBACK.user,
    password: password || DEV_FALLBACK.password,
    secret: secret || DEV_FALLBACK.secret,
    configured: true,
    usingDevFallback: !hasAll,
  };
}

const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return base64UrlEncode(new Uint8Array(signature));
}

/** Vergelijking in constante tijd, zodat timing niets verraadt. */
export function safeEqual(a: string, b: string): boolean {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  let diff = aBytes.length ^ bBytes.length;
  const length = Math.max(aBytes.length, bBytes.length);
  for (let index = 0; index < length; index += 1) {
    diff |= (aBytes[index] ?? 0) ^ (bBytes[index] ?? 0);
  }
  return diff === 0;
}

export async function createSessionToken(
  user: string,
  now: Date = new Date(),
): Promise<string> {
  const { secret } = adminAuthConfig();
  const session: AdminSession = {
    user,
    exp: Math.floor(now.getTime() / 1000) + SESSION_TTL_SECONDS,
  };
  const payload = base64UrlEncode(encoder.encode(JSON.stringify(session)));
  const signature = await sign(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
  now: Date = new Date(),
): Promise<AdminSession | null> {
  if (!token) return null;

  const config = adminAuthConfig();
  if (!config.configured) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = await sign(payload, config.secret);
  if (!safeEqual(signature, expected)) return null;

  try {
    const decoded = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
    if (
      typeof decoded?.user !== "string" ||
      typeof decoded?.exp !== "number" ||
      decoded.exp * 1000 <= now.getTime()
    ) {
      return null;
    }
    return { user: decoded.user, exp: decoded.exp };
  } catch {
    return null;
  }
}

/**
 * Alleen een pad binnen /admin. Een waarde die met "/admin" begint maar na
 * normalisatie ergens anders uitkomt (backslashes, //, /admin/..) valt terug
 * op het overzicht.
 */
export function safeAdminNextPath(value: unknown): string {
  if (typeof value !== "string") return "/admin";
  if (value.length === 0 || value.length > 300) return "/admin";
  if (/[\u0000-\u001F\u007F\\]/.test(value)) return "/admin";
  if (!value.startsWith("/admin") || value.startsWith("//") || value.includes("://")) {
    return "/admin";
  }

  try {
    const url = new URL(value, "https://broodhuis.invalid");
    if (url.origin !== "https://broodhuis.invalid") return "/admin";
    if (url.username !== "" || url.password !== "") return "/admin";
    if (url.pathname !== "/admin" && !url.pathname.startsWith("/admin/")) return "/admin";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/admin";
  }
}

export function checkCredentials(user: string, password: string): boolean {
  const config = adminAuthConfig();
  if (!config.configured) return false;

  // Beide vergelijkingen altijd uitvoeren, geen vroege return.
  const userOk = safeEqual(user.trim(), config.user);
  const passwordOk = safeEqual(password, config.password);
  return userOk && passwordOk;
}
