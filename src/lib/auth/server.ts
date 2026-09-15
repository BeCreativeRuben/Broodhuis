import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  createSessionToken,
  verifySessionToken,
  type AdminSession,
} from "@/lib/auth/session";

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

/**
 * Elke adminpagina en -actie roept dit aan. De middleware houdt bezoekers al
 * tegen, maar de echte controle hoort ook in de server zelf te gebeuren.
 */
export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function startAdminSession(user: string): Promise<void> {
  const token = await createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
