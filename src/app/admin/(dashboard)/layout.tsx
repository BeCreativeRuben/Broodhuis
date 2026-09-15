import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdminSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/**
 * Schil rond alle beheerpagina's. De loginpagina valt hier bewust buiten
 * (die zit in src/app/admin/login) zodat er geen navigatie rond staat.
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      <AdminNav user={session.user} />
      <div className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
