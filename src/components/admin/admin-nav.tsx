"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CroissantIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  ReceiptTextIcon,
  SettingsIcon,
  StoreIcon,
  TagsIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logout } from "@/server/actions/admin-auth";

const links = [
  { href: "/admin", label: "Overzicht", icon: LayoutDashboardIcon },
  { href: "/admin/bestellingen", label: "Bestellingen", icon: ReceiptTextIcon },
  { href: "/admin/bestellingen/daglijst", label: "Daglijst", icon: StoreIcon },
  { href: "/admin/producten", label: "Producten", icon: CroissantIcon },
  { href: "/admin/categorieen", label: "Categorieën", icon: TagsIcon },
  { href: "/admin/instellingen", label: "Instellingen", icon: SettingsIcon },
];

export function AdminNav({ user }: { user: string }) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Zijbalk op desktop */}
      <aside className="print-hidden hidden w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="border-b border-border p-4">
          <p className="font-heading text-lg font-semibold">{"'t Broodhuis"}</p>
          <p className="text-xs text-muted-foreground">Beheer · {user}</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary",
              )}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-border p-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary"
          >
            <StoreIcon className="size-4" />
            Webshop bekijken
          </Link>
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start gap-2.5 px-3 text-sm text-muted-foreground"
            >
              <LogOutIcon className="size-4" />
              Afmelden
            </Button>
          </form>
        </div>
      </aside>

      {/* Bovenbalk + horizontale navigatie op gsm */}
      <div className="print-hidden sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="font-heading text-base font-semibold">{"'t Broodhuis"}</p>
            <p className="text-xs text-muted-foreground">Beheer · {user}</p>
          </div>
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="rounded-full"
            >
              <LogOutIcon className="size-4" /> Afmelden
            </Button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap",
                isActive(link.href)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60",
              )}
            >
              <link.icon className="size-3.5" />
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
