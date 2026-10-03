import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;
  const isPort3001 = host.includes(":3001") || process.env.APP_ROLE === "admin";
  const storeUrl = process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000";
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001";

  // 1. Requests arriving on the ADMIN service (port 3001):
  if (isPort3001) {
    // Redirect root "/" immediately to "/admin"
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // Customer-only storefront routes redirect to the Storefront service (port 3000)
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

  // 2. Requests arriving on the STOREFRONT service (port 3000):
  // When an admin navigates to /admin on port 3000, redirect them to the dedicated Admin service
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.redirect(new URL(`${adminUrl}${pathname}${request.nextUrl.search}`));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, products/, sitemap.xml, robots.txt, or asset files
     */
    "/((?!_next/static|_next/image|favicon.ico|products/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"
  ]
};
