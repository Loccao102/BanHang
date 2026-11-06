import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Storefront and /admin are served from the same Next.js app at <domain>/admin.
  // If a dedicated admin process is started on port 3001, redirect its root "/" to "/admin".
  const isPort3001 = host.includes(":3001") || process.env.APP_ROLE === "admin";
  if (isPort3001 && pathname === "/") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|products/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"
  ]
};
