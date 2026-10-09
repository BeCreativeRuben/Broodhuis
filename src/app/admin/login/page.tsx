import type { Metadata } from "next";
import Link from "next/link";
import { WheatIcon } from "lucide-react";

import { LoginForm } from "@/components/admin/login-form";
import { adminAuthConfig } from "@/lib/auth/session";
import { SHOP } from "@/lib/shop-config";

export const metadata: Metadata = {
  title: "Inloggen",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ volgende?: string }>;
}) {
  const { volgende } = await searchParams;
  const config = adminAuthConfig();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <WheatIcon className="size-6" />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-semibold">
              {SHOP.name} · beheer
            </h1>
            <p className="text-sm text-muted-foreground">
              Meld je aan om het assortiment en de bestellingen te beheren.
            </p>
          </div>
        </div>

        <div>
          <LoginForm next={volgende ?? null} />
        </div>

        {config.usingDevFallback && (
          <p className="rounded-xl border border-warning/50 bg-warning/15 p-3 text-xs text-warning-foreground">
            Ontwikkelmodus: er is nog geen ADMIN_PASSWORD ingesteld, dus{" "}
            <span className="font-medium">marie</span> /{" "}
            <span className="font-medium">broodhuis</span> werkt. Zet de
            omgevingsvariabelen voor je live gaat.
          </p>
        )}

        <p className="text-center text-sm">
          <Link href="/" className="inline-flex min-h-12 items-center text-muted-foreground hover:text-foreground">
            ← Terug naar de webshop
          </Link>
        </p>
      </div>
    </div>
  );
}
