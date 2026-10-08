import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { FULFILLMENT_INTENT_COOKIE } from "@/lib/delivery-intent";

function redirectToAssortiment(request: NextRequest) {
  const destination = new URL("/assortiment", request.url);
  const response = NextResponse.redirect(destination);
  const levering = request.nextUrl.searchParams.get("levering");

  if (levering === "1" || levering === "0") {
    response.cookies.set(
      FULFILLMENT_INTENT_COOKIE,
      levering === "1" ? "delivery" : "pickup",
      {
        path: "/",
        maxAge: 60 * 60 * 12,
        sameSite: "lax",
        httpOnly: false,
        secure: request.nextUrl.protocol === "https:",
      },
    );
  }

  return response;
}

/**
 * Houdt bezoekers zonder geldige sessie weg van de admin. De adminpagina's
 * controleren zelf óók nog eens (zie requireAdminSession), zodat de beveiliging
 * niet enkel van de middleware afhangt.
 *
 * /bestellen opent het assortiment. ?levering=1 vraagt levering aan,
 * ?levering=0 is een gewone bestelling (afhalen). De kassa leest dat.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/bestellen") {
    return redirectToAssortiment(request);
  }

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
  matcher: ["/admin", "/admin/:path*", "/bestellen"],
};
