import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // The two-port split only exists for local development.
  // Production/Vercel serves storefront and /admin from the same Next.js app.
  const isLocalHost = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
  if (!isLocalHost) {
    return NextResponse.next();
  }

  const isPort3001 = host.includes(":3001") || process.env.APP_ROLE === "admin";
  const storeUrl = process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000";
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001";

  // Requests arriving on the local ADMIN service (port 3001).
  if (isPort3001) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    const storefrontRoutes = [
      "/shop",
      "/cart",
      "/checkout",
      "/try-on",
      "/outfit",
      "/social",
      "/size-guide",
      "/about",
      "/wishlist"
    ];

    if (storefrontRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
      return NextResponse.redirect(new URL(`${storeUrl}${pathname}${request.nextUrl.search}`));
    }

    return NextResponse.next();
  }

  // Requests arriving on the local STOREFRONT service (port 3000).
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.redirect(new URL(`${adminUrl}${pathname}${request.nextUrl.search}`));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|products/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"
  ]
};
