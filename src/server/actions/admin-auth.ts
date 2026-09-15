"use server";

import { redirect } from "next/navigation";

import { adminAuthConfig, checkCredentials } from "@/lib/auth/session";
import { endAdminSession, startAdminSession } from "@/lib/auth/server";
import type { LoginState } from "@/lib/form-state";
import { loginSchema } from "@/lib/validation";

/**
 * Heel eenvoudige bescherming tegen brute force: per proces bijhouden hoeveel
 * mislukte pogingen er waren. Voor één bakkerij is dat genoeg; op meerdere
 * instanties hoort dit in de database of achter een rate limiter.
 */
const attempts = new Map<string, { count: number; firstAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function tooManyAttempts(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function registerFailure(key: string): void {
  const entry = attempts.get(key);
  if (!entry || Date.now() - entry.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: Date.now() });
    return;
  }
  entry.count += 1;
}

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    user: formData.get("user") ?? "",
    password: formData.get("password") ?? "",
  });

  if (!parsed.success) {
    return { error: "Vul je gebruikersnaam en wachtwoord in." };
  }

  const config = adminAuthConfig();
  if (!config.configured) {
    return {
      error:
        "De admin is nog niet ingesteld. Zet ADMIN_USER, ADMIN_PASSWORD en ADMIN_SESSION_SECRET in de omgevingsvariabelen.",
    };
  }

  const throttleKey = parsed.data.user.toLowerCase();
  if (tooManyAttempts(throttleKey)) {
    return {
      error: "Te veel pogingen. Wacht een tiental minuten en probeer opnieuw.",
    };
  }

  if (!checkCredentials(parsed.data.user, parsed.data.password)) {
    registerFailure(throttleKey);
    return { error: "Die combinatie kennen we niet. Probeer opnieuw." };
  }

  attempts.delete(throttleKey);
  await startAdminSession(parsed.data.user);

  const next = formData.get("volgende");
  const target =
    typeof next === "string" && next.startsWith("/admin") ? next : "/admin";
  redirect(target);
}

export async function logout(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login");
}
