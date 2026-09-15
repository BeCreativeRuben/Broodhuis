import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

/**
 * Houdt bezoekers zonder geldige sessie weg van de admin. De adminpagina's
 * controleren zelf óók nog eens (zie requireAdminSession), zodat de beveiliging
 * niet enkel van de middleware afhangt.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const session = await verifySessionToken(
    request.cookies.get(ADMIN_COOKIE_NAME)?.value,
  );

  if (pathname === "/admin/login") {
    if (session) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/admin/login", request.url);
    const target = `${pathname}${search}`;
    if (target !== "/admin") {
      loginUrl.searchParams.set("volgende", target);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
